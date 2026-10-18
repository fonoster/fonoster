package node

import (
	"sync"
	"time"
)

// Events keyed by call (redesign-media-node, media-control "Events on NATS are keyed by call with
// sequence numbers and labels"). Every call with a call_ref (CreateCall, room.create with callRef,
// an inbound INVITE with X-Call-Ref) has its own subject; room-scoped events go to the room's.
// Each event carries node_ref, a per-call (or per-room) seq starting at 1, the call's labels and
// a timestamp, so any controller replica can follow a call it did not place.
//
// The room events on media.<nodeId>.events.<roomRef> are unchanged: the gateway's NATS command
// path reads them until it is retired (tasks 6.2, 7.5). Only the spec-named events below are
// published on the new subjects; receivers ignore unknown types and fields.

// CallEventsSubject is where a call's events go: call.started, call.ringing, call.answered,
// call.ended, participant.joined, participant.left and operation.done.
func CallEventsSubject(callRef string) string { return "roomr.events." + callRef }

// RoomEventsSubject is where a room's own events go: room.ended, and participant and operation
// events that belong to no call.
func RoomEventsSubject(roomRef string) string { return "roomr.events.room." + roomRef }

// callStream is one call's event sequence.
type callStream struct {
	ref, room string
	// participant is the call's leg in the room, once known (inbound: the caller; outbound: the
	// answered leg).
	participant string
	labels      map[string]string
	seq         uint64
	answered    bool
}

// eventStreams are the node's open call streams and room sequence numbers.
type eventStreams struct {
	mu      sync.Mutex
	calls   map[string]*callStream
	roomSeq map[string]uint64
}

func (n *Node) eventBase(typ string) Event {
	return Event{"type": typ, "node_ref": n.cfg.NodeID, "ts": time.Now().UTC().Format(time.RFC3339Nano)}
}

// openCall starts a call's stream and publishes call.started (once per call_ref).
func (n *Node) openCall(callRef, roomRef, participantRef string, labels map[string]string, extra Event) {
	if callRef == "" || !validToken(callRef) {
		return
	}
	s := &n.events
	s.mu.Lock()
	if s.calls == nil {
		s.calls = map[string]*callStream{}
	}
	if s.calls[callRef] != nil {
		s.mu.Unlock()
		return
	}
	if labels == nil {
		labels = map[string]string{}
	}
	s.calls[callRef] = &callStream{ref: callRef, room: roomRef, participant: participantRef, labels: labels}
	s.mu.Unlock()
	n.callEvent(callRef, "call.started", extra, nil)
}

// callEvent publishes one event of an open call; update, when set, changes the stream under the
// same lock first and may return false to publish nothing. call.ended closes the stream. It
// returns false when nothing was published.
func (n *Node) callEvent(callRef, typ string, extra Event, update func(*callStream) bool) bool {
	s := &n.events
	s.mu.Lock()
	defer s.mu.Unlock()
	c := s.calls[callRef]
	if c == nil {
		return false
	}
	if update != nil && !update(c) {
		return false
	}
	c.seq++
	ev := n.eventBase(typ)
	for k, v := range extra {
		ev[k] = v
	}
	ev["call_ref"], ev["room_ref"], ev["seq"], ev["labels"] = c.ref, c.room, c.seq, c.labels
	if typ == "call.ended" {
		ev["answered"] = c.answered
		delete(s.calls, callRef)
	}
	// Published under the lock: seq order is publication order.
	n.publish(CallEventsSubject(callRef), ev)
	return true
}

// roomEvent publishes one room-scoped event; room.ended forgets the room's sequence.
func (n *Node) roomEvent(roomRef, typ string, extra Event) {
	s := &n.events
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.roomSeq == nil {
		s.roomSeq = map[string]uint64{}
	}
	s.roomSeq[roomRef]++
	ev := n.eventBase(typ)
	for k, v := range extra {
		ev[k] = v
	}
	ev["room_ref"], ev["seq"] = roomRef, s.roomSeq[roomRef]
	if typ == "room.ended" {
		delete(s.roomSeq, roomRef)
	}
	n.publish(RoomEventsSubject(roomRef), ev)
}

// findCall picks the open call an event of room roomRef belongs to: the call named by callRef,
// else the call whose leg is participantRef, else (when pending) the room's one call still
// waiting for its leg to answer. "" when none.
func (n *Node) findCall(roomRef, callRef, participantRef string, pending bool) string {
	s := &n.events
	s.mu.Lock()
	defer s.mu.Unlock()
	if callRef != "" {
		if s.calls[callRef] != nil {
			return callRef
		}
		return ""
	}
	match := ""
	for ref, c := range s.calls {
		if c.room != roomRef {
			continue
		}
		if participantRef != "" && c.participant == participantRef {
			return ref
		}
		if pending && !c.answered && c.participant == "" {
			if match != "" {
				return "" // two candidates: attribute to neither
			}
			match = ref
		}
	}
	return match
}

// roomCalls are the open calls in a room.
func (n *Node) roomCalls(roomRef string) []string {
	s := &n.events
	s.mu.Lock()
	defer s.mu.Unlock()
	var refs []string
	for ref, c := range s.calls {
		if c.room == roomRef {
			refs = append(refs, ref)
		}
	}
	return refs
}

// endCause is a failed dial's cause: the event's own, else from its SIP status.
func endCause(ev Event, status int) string {
	if c, _ := ev["cause"].(string); c != "" {
		return c
	}
	return failCause(status)
}

func intOf(v any) int {
	switch x := v.(type) {
	case int:
		return x
	case float64:
		return int(x)
	}
	return 0
}

// forward republishes a room event (media.<nodeId>.events.<roomRef>) on the call or room subject
// it belongs to, in the spec's names.
func (n *Node) forward(roomRef string, ev Event) {
	typ, _ := ev["type"].(string)
	callRef, _ := ev["callRef"].(string)
	participantRef, _ := ev["participantRef"].(string)
	switch typ {
	case "call.progress":
		ref := n.findCall(roomRef, callRef, "", true)
		if ref == "" {
			return
		}
		if ev["status"] == "ringing" {
			n.callEvent(ref, "call.ringing", nil, nil)
			return
		}
		status := intOf(ev["sipStatus"])
		out := Event{"cause": endCause(ev, status)}
		if status != 0 {
			out["sip_status"] = status
		}
		n.callEvent(ref, "call.ended", out, nil)
	case "call.answered":
		ref := n.findCall(roomRef, callRef, "", true)
		if ref == "" {
			return
		}
		n.callEvent(ref, "call.answered", Event{"participant_ref": participantRef}, func(c *callStream) bool {
			if c.answered {
				return false
			}
			c.answered, c.participant = true, participantRef
			return true
		})
	case "participant.joined":
		out := Event{"participant_ref": participantRef, "tracks": ev["tracks"]}
		if ref := n.findCall(roomRef, callRef, participantRef, false); ref != "" {
			n.callEvent(ref, typ, out, nil)
		} else {
			n.roomEvent(roomRef, typ, out)
		}
	case "participant.left":
		reason, _ := ev["reason"].(string)
		out := Event{"participant_ref": participantRef, "cause": reason}
		if ref := n.findCall(roomRef, "", participantRef, false); ref != "" {
			// The call's leg left: the call is over.
			n.callEvent(ref, typ, out, nil)
			n.callEvent(ref, "call.ended", Event{"cause": reason}, nil)
		} else {
			n.roomEvent(roomRef, typ, out)
		}
	case "operation.done":
		out := Event{"operation_ref": ev["operationRef"], "status": ev["status"]}
		if e, ok := ev["error"]; ok {
			out["error"] = e
		}
		if calls := n.roomCalls(roomRef); len(calls) == 1 {
			n.callEvent(calls[0], typ, out, nil)
		} else {
			n.roomEvent(roomRef, typ, out)
		}
	case "room.ended":
		reason, _ := ev["reason"].(string)
		out := Event{"cause": reason}
		if status := intOf(ev["sipStatus"]); status != 0 {
			out["sip_status"] = status
		}
		for _, ref := range n.roomCalls(roomRef) {
			n.callEvent(ref, "call.ended", out, nil)
		}
		n.roomEvent(roomRef, typ, out)
	}
}

// callerEvent publishes an inbound call's ringing or answer (the app's ring and answer).
func (n *Node) callerEvent(r *Room, typ string) {
	c := r.caller()
	if c == nil {
		return
	}
	ref := n.findCall(r.Ref, "", c.Ref, false)
	if ref == "" {
		return
	}
	n.callEvent(ref, typ, Event{"participant_ref": c.Ref}, func(s *callStream) bool {
		if s.answered {
			return false // answered already (a repeated answer, or ringing after it)
		}
		if typ == "call.answered" {
			s.answered = true
		}
		return true
	})
}

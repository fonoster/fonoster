package node

import "time"

// Events on NATS (media-control, "Events on NATS are keyed by call with sequence numbers and
// metadata"): a call's events on roomr.events.<call_ref> with a per-call seq, a room's own events
// on roomr.events.room.<room_ref> with a per-room seq. Every event carries node_ref, its seq and
// a timestamp; call events carry the call's metadata, passed through untouched.

// CallEventsSubject is where a call's events go: call.started, call.ringing, call.answered,
// call.ended, participant.joined and participant.left for its legs, and operation.done for
// operations a controller started on it.
func CallEventsSubject(callRef string) string { return "roomr.events." + callRef }

// RoomEventsSubject is where a room's own events go: room.ended, participant events for
// participants that belong to no call, and operation.done for room-wide operations.
func RoomEventsSubject(roomRef string) string { return "roomr.events.room." + roomRef }

func (n *Node) eventBase(typ string) Event {
	return Event{"type": typ, "node_ref": n.cfg.NodeID, "ts": time.Now().UTC().Format(time.RFC3339Nano)}
}

package e2e

import (
	"encoding/json"
	"sync"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/nats-io/nats.go"
)

// The node's room limit (media-node "Call and room limits"; fix-config-and-placement-gaps 1.1):
// heartbeats report it, room.create beyond it is refused with at_capacity, and a room that ends
// frees a place.
func TestRoomLimitRefusesRoomCreate(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 2 }})
	hb, _ := r.nc.SubscribeSync(node.HeartbeatSubject(r.node.ID()))
	defer hb.Unsubscribe()

	first := r.command(map[string]any{"type": "room.create", "id": "c1"})
	second := r.command(map[string]any{"type": "room.create", "id": "c2"})
	if first["type"] != "ack" || second["type"] != "ack" {
		t.Fatalf("replies below the limit: %v, %v", first, second)
	}
	third := r.command(map[string]any{"type": "room.create", "id": "c3"})
	if third["type"] != "error" || third["code"] != "at_capacity" || third["id"] != "c3" || third["message"] == nil {
		t.Fatalf("reply at the limit: %v", third)
	}
	if !r.node.AtCapacity() || r.node.ActiveRooms() != 2 {
		t.Fatalf("rooms %d, at capacity %v", r.node.ActiveRooms(), r.node.AtCapacity())
	}

	// The heartbeat reports the load and the limit (the next beat after both rooms exist).
	deadline := time.Now().Add(2 * time.Second)
	for {
		msg, err := hb.NextMsg(time.Until(deadline))
		if err != nil {
			t.Fatal("no heartbeat with rooms 2 and max_rooms 2")
		}
		var ev map[string]any
		_ = json.Unmarshal(msg.Data, &ev)
		if ev["rooms"] == float64(2) && ev["max_rooms"] == float64(2) {
			break
		}
	}

	// Ending a room frees a place.
	room := first["roomRef"].(string)
	r.command(map[string]any{"type": "room.end", "id": "e1", "roomRef": room})
	r.waitEvent(typed("room.ended", "roomRef", room), 2*time.Second)
	if again := r.command(map[string]any{"type": "room.create", "id": "c4"}); again["type"] != "ack" {
		t.Fatalf("reply after a room ended: %v", again)
	}
}

// Concurrent room.create commands never take the node past its limit.
func TestRoomLimitUnderConcurrentCreates(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 5 }})
	var wg sync.WaitGroup
	var mu sync.Mutex
	codes := map[string]int{}
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			data, _ := json.Marshal(map[string]any{"type": "room.create", "id": "c"})
			msg, err := r.nc.Request("media."+r.node.ID()+".commands", data, 2*time.Second)
			if err != nil {
				t.Error(err)
				return
			}
			var reply map[string]any
			_ = json.Unmarshal(msg.Data, &reply)
			mu.Lock()
			if reply["type"] == "ack" {
				codes["ack"]++
			} else {
				codes[reply["code"].(string)]++
			}
			mu.Unlock()
		}()
	}
	wg.Wait()
	if codes["ack"] != 5 || codes["at_capacity"] != 15 || r.node.ActiveRooms() != 5 {
		t.Fatalf("replies %v, rooms %d", codes, r.node.ActiveRooms())
	}
}

// An INVITE that would take the node past its limit is refused with 503 and opens no room.
func TestRoomLimitRefusesInvite(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 1 }})
	if rep := r.command(map[string]any{"type": "room.create", "id": "c1"}); rep["type"] != "ack" {
		t.Fatalf("room.create: %v", rep)
	}
	call, err := r.bot.Dial(r.sip, "+15550003333", "", map[string]string{"X-App-Ref": "app-1"})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 503) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	if r.node.ActiveRooms() != 1 {
		t.Fatalf("rooms %d after the refused INVITE", r.node.ActiveRooms())
	}
}

// A room created for an API-originated call (room.create callRef) publishes the call's events on
// roomr.events.<callRef> with contiguous seq, so any control-plane replica can serve TrackCall.
func TestCallEventsOnTheCallSubject(t *testing.T) {
	r := start(t)
	callRef := "call-" + r.node.ID()
	events := make(chan map[string]any, 16)
	sub, err := r.nc.Subscribe(node.CallEventsSubject(callRef), func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) == nil {
			events <- ev
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	defer sub.Unsubscribe()
	_ = r.nc.Flush()

	room := r.command(map[string]any{"type": "room.create", "id": "c1", "callRef": callRef})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+15551234567"})
	seq := 0.0
	next := func(want string) map[string]any {
		t.Helper()
		select {
		case ev := <-events:
			seq++
			if ev["type"] != want || ev["call_ref"] != callRef || ev["room_ref"] != room || ev["node_ref"] != r.node.ID() ||
				ev["seq"] != seq {
				t.Fatalf("got %v, want %s #%v for %s", ev, want, seq, callRef)
			}
			return ev
		case <-time.After(3 * time.Second):
			t.Fatalf("no %s on the call subject", want)
			return nil
		}
	}
	next("call.started")
	next("call.ringing")
	next("call.answered")
	next("participant.joined")
	// dtmf and the like stay on the room's subject only; ending the room ends the call.
	r.command(map[string]any{"type": "room.end", "id": "e1", "roomRef": room})
	if ev := next("call.ended"); ev["cause"] != node.ReasonRemoved || ev["answered"] != true {
		t.Fatalf("call.ended %v", ev)
	}
	select {
	case ev := <-events:
		t.Fatalf("unexpected event on the call subject: %v", ev)
	case <-time.After(200 * time.Millisecond):
	}
}

// A callRef that is not one subject token is refused.
func TestRoomCreateRefusesABadCallRef(t *testing.T) {
	r := start(t)
	rep := r.command(map[string]any{"type": "room.create", "id": "c1", "callRef": "a.b"})
	if rep["type"] != "error" || rep["code"] != "bad_message" || r.node.ActiveRooms() != 0 {
		t.Fatalf("reply %v, rooms %d", rep, r.node.ActiveRooms())
	}
}

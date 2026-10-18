package e2e

import (
	"encoding/json"
	"fmt"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/nats-io/nats.go"
)

// Rooms without an owner end (roomr "Rooms without an owner end"): a room nobody joins and
// nobody dials into, and a room whose gateway stopped its heartbeats, are ended with node_error,
// free their slot, and report room.ended (and call.ended on roomr.events.<callRef>, so TrackCall
// ends).

func callEvents(t *testing.T, nc *nats.Conn, callRef string) chan map[string]any {
	t.Helper()
	events := make(chan map[string]any, 16)
	sub, err := nc.Subscribe(node.CallEventsSubject(callRef), func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) == nil {
			events <- ev
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = sub.Unsubscribe() })
	_ = nc.Flush()
	return events
}

// The control-plane replica that sent room.create died before participant.dial.
func TestEmptyRoomEnds(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) {
		c.MaxRooms = 1
		c.EmptyRoomTimeout = 500 * time.Millisecond
	}})
	callRef := fmt.Sprintf("orphan-%d", time.Now().UnixNano())
	events := callEvents(t, r.nc, callRef)
	room := r.command(map[string]any{"type": "room.create", "id": "c1", "callRef": callRef})["roomRef"].(string)
	if rep := r.command(map[string]any{"type": "room.create", "id": "c2"}); rep["code"] != "at_capacity" {
		t.Fatalf("second room.create: %v", rep)
	}
	ended := r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
	if ended["reason"] != node.ReasonNodeError {
		t.Fatalf("room.ended %v", ended)
	}
	for _, want := range []string{"call.started", "call.ended"} {
		select {
		case ev := <-events:
			if ev["type"] != want || (want == "call.ended" && ev["cause"] != node.ReasonNodeError) {
				t.Fatalf("call subject got %v, want %s", ev, want)
			}
		case <-time.After(2 * time.Second):
			t.Fatalf("no %s on the call subject", want)
		}
	}
	// The slot is free again.
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("rooms %d", n)
	}
	if rep := r.command(map[string]any{"type": "room.create", "id": "c3"}); rep["type"] != "ack" {
		t.Fatalf("room.create after the orphan ended: %v", rep)
	}
}

// A room waiting on a dial is not empty; a room with a participant is not empty.
func TestDialingRoomIsNotEmpty(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.EmptyRoomTimeout = 300 * time.Millisecond }})
	r.callee.Callee("answer", 1200*time.Millisecond) // rings well past the timeout
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+15551234567"})
	r.waitEvent(typed("call.answered", "id", "d1"), 4*time.Second)
	time.Sleep(time.Second)
	if r.count(typed("room.ended", "roomRef", room)) != 0 {
		t.Fatal("a dialing or answered room was ended as empty")
	}
}

// A failed dial into an otherwise empty room ends the call at once (busy), not after a timeout.
func TestFailedDialEndsEmptyRoom(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+1"})
	r.waitEvent(typed("call.progress", "id", "d1", "status", "busy"), 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "busy", "sipStatus", 486), 2*time.Second)
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("rooms %d", n)
	}
}

// The gateway that claimed an answered call dies: once its heartbeats stop, the node ends the
// room and the caller gets BYE instead of dead air until MaxDuration.
func TestRoomEndsWhenItsGatewayIsLost(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.OwnerTimeout = 600 * time.Millisecond }})
	gatewayRef := fmt.Sprintf("gw-%d", time.Now().UnixNano())
	r.mu.Lock()
	r.claimAs = gatewayRef
	r.mu.Unlock()
	beat := func() {
		_ = r.nc.Publish(node.GatewayHeartbeatSubject, []byte(`{"type":"gateway.heartbeat","gatewayRef":"`+gatewayRef+`","calls":1}`))
		_ = r.nc.Flush()
	}
	beat()
	call, room, _ := r.answeredCall()
	// A live gateway keeps its rooms.
	for i := 0; i < 6; i++ {
		beat()
		time.Sleep(200 * time.Millisecond)
	}
	if r.count(typed("room.ended", "roomRef", room)) != 0 {
		t.Fatal("the room of a live gateway ended")
	}
	// Killed: no more heartbeats.
	ended := r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
	if ended["reason"] != node.ReasonNodeError {
		t.Fatalf("room.ended %v", ended)
	}
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("rooms %d", n)
	}
}

// A gateway the node never heard (no permission to see heartbeats, an older gateway) is never
// judged gone.
func TestUnheardGatewayKeepsItsRooms(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.OwnerTimeout = 300 * time.Millisecond }})
	r.mu.Lock()
	r.claimAs = fmt.Sprintf("gw-silent-%d", time.Now().UnixNano())
	r.mu.Unlock()
	_, room, _ := r.answeredCall()
	time.Sleep(1500 * time.Millisecond)
	if r.count(typed("room.ended", "roomRef", room)) != 0 {
		t.Fatal("a room of a gateway never heard was ended")
	}
}

// The gateway that acked an outbound call dies while it rings (in-memory state audit, test 5):
// participant.dial named it as owner, so once its heartbeats stop the node ends the room, also
// after the callee answers into it, instead of leaving the callee in dead air.
func TestOutboundRoomEndsWhenItsGatewayDiesWhileRinging(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.OwnerTimeout = 800 * time.Millisecond }})
	gatewayRef := fmt.Sprintf("gw-out-%d", time.Now().UnixNano())
	// The gateway is alive when it takes the call, then is killed: one heartbeat, no more.
	_ = r.nc.Publish(node.GatewayHeartbeatSubject, []byte(`{"type":"gateway.heartbeat","gatewayRef":"`+gatewayRef+`","calls":0}`))
	_ = r.nc.Flush()
	r.callee.Callee("answer", 300*time.Millisecond) // answers after the gateway is gone
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room,
		"to": "+15551234567", "gatewayRef": gatewayRef})
	r.waitEvent(typed("call.answered", "id", "d1"), 3*time.Second)
	ended := r.waitEvent(typed("room.ended", "roomRef", room), 4*time.Second)
	if ended["reason"] != node.ReasonNodeError {
		t.Fatalf("room.ended %v", ended)
	}
	deadline := time.Now().Add(3 * time.Second)
	for {
		calls := r.callee.Calls()
		if len(calls) == 1 && calls[0].State == "ended" {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("the callee's call did not end: %+v", calls)
		}
		time.Sleep(20 * time.Millisecond)
	}
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("rooms %d", n)
	}
}

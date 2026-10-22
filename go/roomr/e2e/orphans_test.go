package e2e

import (
	"fmt"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
)

// Rooms without an owner end (roomr "Rooms without an owner end"): a room nobody joins and
// nobody dials into is ended with node_error, frees its slot and reports room.ended on its
// subject. A call whose app is gone is ended by its control stream (calls_test.go), not here.

// The controller that sent CreateRoom died before anything joined.
func TestROM035_EmptyRoomEnds(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) {
		c.MaxRooms = 1
		c.EmptyRoomTimeout = 500 * time.Millisecond
	}})
	ref := fmt.Sprintf("orphan-%d", time.Now().UnixNano())
	events := replica(t, node.RoomEventsSubject(ref))
	if _, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{RoomRef: ref}); err != nil {
		t.Fatal(err)
	}
	if _, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{}); err == nil {
		t.Fatal("a second room past the limit")
	}
	select {
	case ev := <-events:
		if ev["type"] != "room.ended" || ev["cause"] != node.ReasonNodeError {
			t.Fatalf("room event %v", ev)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("no room.ended")
	}
	deadline := time.Now().Add(time.Second)
	for r.node.ActiveRooms() != 0 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	r.createRoom()
}

// A room waiting on a dial is not empty; a room with a participant is not empty.
func TestROM035_DialingRoomIsNotEmpty(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.EmptyRoomTimeout = 300 * time.Millisecond }})
	r.callee.Callee("answer", 1200*time.Millisecond) // rings well past the timeout
	room := r.createRoom()
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{RoomRef: room,
		To: &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid"}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.answered", "call_ref", call.CallRef), 4*time.Second)
	time.Sleep(time.Second)
	if r.count(typed("room.ended", "room_ref", room)) != 0 {
		t.Fatal("a dialing or answered room was ended as empty")
	}
}

// A failed dial into an otherwise empty room ends the room at once (busy), not after a timeout.
func TestROM035_FailedDialEndsEmptyRoom(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	room := r.createRoom()
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{RoomRef: room,
		To: &roomrv1.SipTarget{Uri: "sip:+1@carrier.invalid"}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", call.CallRef, "cause", "busy"), 3*time.Second)
	r.waitEvent(typed("room.ended", "room_ref", room, "cause", "busy", "sip_status", 486), 2*time.Second)
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("rooms %d", n)
	}
}

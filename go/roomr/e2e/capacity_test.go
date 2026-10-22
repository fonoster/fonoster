package e2e

import (
	"encoding/json"
	"fmt"
	"sync"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// The node's room limit (roomr "Call and room limits"): heartbeats report it, CreateRoom beyond
// it is RESOURCE_EXHAUSTED, and a room that ends frees a place.
func TestROM020_RoomLimitRefusesRoomCreate(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 2 }})
	hb, _ := r.nc.SubscribeSync(node.HeartbeatSubject(r.node.ID()))
	defer hb.Unsubscribe()
	first := r.createRoom()
	r.createRoom()
	_, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{})
	wantStatus(t, err, codes.ResourceExhausted, node.CodeAtCapacity)
	if !r.node.AtCapacity() || r.node.ActiveRooms() != 2 {
		t.Fatalf("rooms %d, at capacity %v", r.node.ActiveRooms(), r.node.AtCapacity())
	}
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
	if _, err := r.mc.EndRoom(rpcCtx(t), &roomrv1.EndRoomRequest{RoomRef: first}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "room_ref", first), 2*time.Second)
	r.createRoom()
}

// Concurrent CreateRoom calls never take the node past its limit.
func TestROM020_RoomLimitUnderConcurrentCreates(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 5 }})
	var wg sync.WaitGroup
	var mu sync.Mutex
	got := map[codes.Code]int{}
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{})
			mu.Lock()
			got[status.Code(err)]++
			mu.Unlock()
		}()
	}
	wg.Wait()
	if got[codes.OK] != 5 || got[codes.ResourceExhausted] != 15 || r.node.ActiveRooms() != 5 {
		t.Fatalf("replies %v, rooms %d", got, r.node.ActiveRooms())
	}
}

// An INVITE that would take the node past its limit is refused with 503 and opens no room.
func TestROM020_RoomLimitRefusesInvite(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 1 }})
	r.createRoom()
	call, err := r.bot.Dial(r.sip, "+15550003333", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 503) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	if r.node.ActiveRooms() != 1 || r.app.count() != 0 {
		t.Fatalf("rooms %d, streams %d after the refused INVITE", r.node.ActiveRooms(), r.app.count())
	}
}

// A CreateCall into a CreateRoom room publishes its events on roomr.events.<call_ref> with
// contiguous seq; ending the room ends the call.
func TestROM029_CallEventsOnTheCallSubject(t *testing.T) {
	r := start(t)
	callRef := fmt.Sprintf("call-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(callRef))
	room := r.createRoom()
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef, RoomRef: room,
		To: &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid"}}); err != nil {
		t.Fatal(err)
	}
	expectSeq(t, events, callRef, r.node.ID(), 1, "call.started", "call.ringing", "call.answered",
		"participant.joined", "participant.joined")
	if _, err := r.mc.EndRoom(rpcCtx(t), &roomrv1.EndRoomRequest{RoomRef: room}); err != nil {
		t.Fatal(err)
	}
	got := expectSeq(t, events, callRef, r.node.ID(), 6, "participant.left", "participant.left", "call.ended")
	if ev := got[2]; ev["cause"] != node.ReasonRemoved || ev["answered"] != true || ev["room_ref"] != room {
		t.Fatalf("call.ended %v", ev)
	}
	select {
	case ev := <-events:
		t.Fatalf("unexpected event on the call subject: %v", ev)
	case <-time.After(200 * time.Millisecond):
	}
}

// A call_ref or room_ref that is not one subject token is refused.
func TestROM026_RoomCreateRefusesABadCallRef(t *testing.T) {
	r := start(t)
	_, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: "a.b",
		To: &roomrv1.SipTarget{Uri: "sip:+1@carrier.invalid"}})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	_, err = r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{RoomRef: "a b"})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	if r.node.ActiveRooms() != 0 || len(r.callee.Calls()) != 0 {
		t.Fatalf("rooms %d, INVITEs %d", r.node.ActiveRooms(), len(r.callee.Calls()))
	}
}

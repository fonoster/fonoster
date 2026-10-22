package e2e

import (
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/grpc/codes"
)

// TestROM018_RoomrCreateRoomOverrides: CreateRoom's empty_room_timeout_s and max_participants override
// the node's settings (30 s and 10) for that room only.
func TestROM018_RoomrCreateRoomOverrides(t *testing.T) {
	r := start(t)
	ctx := rpcCtx(t)
	short, err := r.mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{MaxParticipants: 1})
	if err != nil {
		t.Fatal(err)
	}
	other := r.createRoom()
	join := func(room string) error {
		_, err := r.mc.AddParticipant(ctx, &roomrv1.AddParticipantRequest{RoomRef: room, Endpoint: &roomrv1.AddParticipantRequest_Rtp{
			Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "L16/16000"}}})
		return err
	}
	if err := join(short.RoomRef); err != nil {
		t.Fatal(err)
	}
	wantStatus(t, join(short.RoomRef), codes.ResourceExhausted, node.CodeRoomFull)
	for range 2 {
		if err := join(other); err != nil {
			t.Fatal(err)
		}
	}
	empty, err := r.mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{EmptyRoomTimeoutS: 1})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "room_ref", empty.RoomRef, "cause", "node_error"), 5*time.Second)
	if n := r.node.Participants(other); n != 2 {
		t.Fatalf("the other room has %d participants, want 2", n)
	}
}

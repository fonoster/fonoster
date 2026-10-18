package e2e

import (
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/grpc/codes"
)

// TestRoomrCreateRoomOverrides: CreateRoom's empty_timeout_s and max_participants override the
// node's settings (30 s and 10) for that room only.
func TestRoomrCreateRoomOverrides(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	ctx := rpcCtx(t)

	short, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{MaxParticipants: 1})
	if err != nil {
		t.Fatal(err)
	}
	other, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	join := func(room string) error {
		_, err := mc.Join(ctx, &roomrv1.JoinRequest{RoomRef: room, Endpoint: &roomrv1.JoinRequest_Rtp{
			Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "L16/16000"}}})
		return err
	}
	if err := join(short.RoomRef); err != nil {
		t.Fatal(err)
	}
	wantStatus(t, join(short.RoomRef), codes.ResourceExhausted, node.CodeRoomFull)
	// The node's own limit (10) applies to the other room.
	for range 2 {
		if err := join(other.RoomRef); err != nil {
			t.Fatal(err)
		}
	}
	// A room left empty ends after its own timeout, not the node's 30 s.
	empty, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{EmptyTimeoutS: 1})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "roomRef", empty.RoomRef, "reason", "node_error"), 5*time.Second)
	if n := r.node.Participants(other.RoomRef); n != 2 {
		t.Fatalf("the other room has %d participants, want 2", n)
	}
}

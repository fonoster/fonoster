package node

import (
	"encoding/hex"
	"strings"
	"testing"
	"time"
)

// Room refs the node generates are distinct and carry 128 random bits (roomr "Generated refs
// are random").
func TestGeneratedRoomRefsAreRandom(t *testing.T) {
	n := New(nil, Config{MaxRooms: 1000, EmptyRoomTimeout: -1})
	defer n.Shutdown()
	seen := map[string]bool{}
	for range 1000 {
		r, err := n.openRoom("", false, false, false)
		if err != nil {
			t.Fatal(err)
		}
		if seen[r.Ref] {
			t.Fatalf("duplicate room ref %s", r.Ref)
		}
		seen[r.Ref] = true
		raw, err := hex.DecodeString(strings.TrimPrefix(r.Ref, "room-"))
		if err != nil || len(raw) < 16 {
			t.Fatalf("room ref %s does not carry 128 bits", r.Ref)
		}
	}
}

func TestValidRef(t *testing.T) {
	for _, ok := range []string{"abc123", "call-9", "out7", "c_1:2"} {
		if !validRef(ok) {
			t.Errorf("%q refused", ok)
		}
	}
	for _, bad := range []string{"", "a.b", "a b", "a*", "a>", "x\ny", strings.Repeat("x", 129)} {
		if validRef(bad) {
			t.Errorf("%q accepted", bad)
		}
	}
}

// A CreateCall reservation counts toward MaxRooms while the callee rings; it is released when
// the dial fails and consumed when the room is created on the answer.
func TestReservationsCountTowardTheRoomLimit(t *testing.T) {
	n := New(nil, Config{MaxRooms: 2, EmptyRoomTimeout: -1})
	defer n.Shutdown()
	if _, err := n.openRoom("a", false, false, false); err != nil {
		t.Fatal(err)
	}
	if err := n.reserve("b"); err != nil {
		t.Fatal(err)
	}
	if !n.AtCapacity() {
		t.Fatal("a reservation does not count toward the limit")
	}
	if _, err := n.openRoom("", false, false, false); err == nil || err.(*Error).Code != CodeAtCapacity {
		t.Fatalf("room past the limit: %v", err)
	}
	if err := n.reserve("c"); err == nil {
		t.Fatal("a reservation past the limit was taken")
	}
	// A second reservation of the same ref takes no new place; a room of a reserved ref is not
	// created by CreateRoom.
	if err := n.reserve("b"); err != nil {
		t.Fatal(err)
	}
	if _, err := n.openRoom("b", false, false, false); err == nil || err.(*Error).Code != CodeRoomExists {
		t.Fatalf("CreateRoom of a reserved ref: %v", err)
	}
	n.release("b")
	r, err := n.openRoom("b", true, true, true)
	if err != nil || r.Ref != "b" || n.ActiveRooms() != 2 {
		t.Fatalf("answer into the reserved room: %v %v rooms %d", r, err, n.ActiveRooms())
	}
	if n.busy() != 2 {
		t.Fatalf("load %d, want 2", n.busy())
	}
	r.end(ReasonRemoved, 0)
	deadline := time.Now().Add(time.Second)
	for n.ActiveRooms() != 1 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if n.AtCapacity() {
		t.Fatal("an ended room still counts")
	}
}

func TestHeaderValueIgnoresCase(t *testing.T) {
	h := map[string]string{"x-room-ref": " r1 "}
	if v, ok := headerValue(h, "X-Room-Ref"); !ok || v != "r1" {
		t.Fatalf("got %q %v", v, ok)
	}
	if _, ok := headerValue(h, ""); ok {
		t.Fatal("an unset header name matched")
	}
}

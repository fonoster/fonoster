// End-to-end tests of CreateCall's contract with the controller (redesign-media-node, decisions
// 3 and 7): failed dials leave no room, a repeated call_ref is idempotent within the dedupe window
// and refused when its parameters differ, the configured call-ref header names calls both ways,
// a digest challenge is answered with to.auth, and to.headers reach the INVITE byte for byte.
package e2e

import (
	"fmt"
	"strings"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/grpc/codes"
)

// roomGone waits until the node no longer holds room.
func roomGone(t *testing.T, r *rig, room string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for roomParticipants(r.node, room) >= 0 {
		if time.Now().After(deadline) {
			t.Fatalf("room %s still up", room)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

// find is the first recorded event that matches, or nil.
func (r *rig) find(match func(map[string]any) bool) map[string]any {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, ev := range r.events {
		if match(ev) {
			return ev
		}
	}
	return nil
}

// TestCreateCallFailuresLeaveNoRoom: busy, no answer and a rejection each end the call with its
// SIP status and cause, the room CreateCall opened is gone and nobody joined it.
func TestCreateCallFailuresLeaveNoRoom(t *testing.T) {
	for _, tc := range []struct {
		mode, cause string
		sip         int
		ring        uint32
	}{
		{"busy", "busy", 486, 10},
		{"no_answer", "no_answer", 408, 1},
		{"decline", "rejected", 603, 10},
	} {
		t.Run(tc.mode, func(t *testing.T) {
			r := start(t)
			_, mc := r.withControl(nil)
			r.callee.Callee(tc.mode, 0)
			ref := fmt.Sprintf("%s-%d", tc.mode, time.Now().UnixNano())
			call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, RingTimeoutS: tc.ring,
				To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
			if err != nil || call.State != roomrv1.Call_RINGING {
				t.Fatalf("CreateCall = %v %v", call, err)
			}
			r.waitEvent(typed("call.progress", "callRef", ref, "sipStatus", tc.sip, "cause", tc.cause), 4*time.Second)
			r.waitEvent(typed("room.ended", "roomRef", call.RoomRef, "reason", tc.cause), 2*time.Second)
			roomGone(t, r, call.RoomRef)
			if ev := r.find(typed("participant.joined", "roomRef", call.RoomRef)); ev != nil {
				t.Fatalf("a participant joined a failed call's room: %v", ev)
			}
		})
	}
}

// TestCreateCallDedupe: within the dedupe window a repeated call_ref returns the call, also once
// it has ended, and sends no second INVITE; the same call_ref with other parameters is ALREADY_EXISTS,
// and so is the call_ref of an inbound call.
func TestCreateCallDedupe(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	ref := fmt.Sprintf("dedupe-%d", time.Now().UnixNano())
	req := &roomrv1.CreateCallRequest{CallRef: ref, Labels: map[string]string{"k": "v"},
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Headers: map[string]string{"X-A": "1"}, Auth: &roomrv1.SipAuth{Username: "u", Password: "p"}}}
	first, err := mc.CreateCall(rpcCtx(t), req)
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.answered", "callRef", ref), 3*time.Second)
	if _, err := mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: ref}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "roomRef", first.RoomRef), 3*time.Second)
	again, err := mc.CreateCall(rpcCtx(t), req)
	if err != nil || again.State != roomrv1.Call_ENDED {
		t.Fatalf("repeat of an ended call = %v %v", again, err)
	}
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d INVITEs, want 1", n)
	}
	for name, change := range map[string]func(*roomrv1.CreateCallRequest){
		"uri":     func(q *roomrv1.CreateCallRequest) { q.To.Uri = "sip:+1666@carrier.invalid" },
		"headers": func(q *roomrv1.CreateCallRequest) { q.To.Headers = map[string]string{"X-A": "2"} },
		"auth": func(q *roomrv1.CreateCallRequest) {
			q.To.Auth = &roomrv1.SipAuth{Username: "u", Password: "zz-other-secret"}
		},
		"labels":   func(q *roomrv1.CreateCallRequest) { q.Labels = nil },
		"ring":     func(q *roomrv1.CreateCallRequest) { q.RingTimeoutS = 5 },
		"room_ref": func(q *roomrv1.CreateCallRequest) { q.RoomRef = "elsewhere" },
	} {
		q := &roomrv1.CreateCallRequest{CallRef: ref, Labels: map[string]string{"k": "v"},
			To: &roomrv1.SipTarget{Uri: req.To.Uri, Proxy: req.To.Proxy, Headers: map[string]string{"X-A": "1"},
				Auth: &roomrv1.SipAuth{Username: "u", Password: "p"}}}
		change(q)
		_, err := mc.CreateCall(rpcCtx(t), q)
		if err == nil {
			t.Fatalf("%s changed: accepted", name)
		}
		wantStatus(t, err, codes.AlreadyExists, node.CodeCallExists)
		// The refusal never echoes the credentials.
		if strings.Contains(err.Error(), "zz-other-secret") {
			t.Fatalf("refusal echoes auth: %v", err)
		}
	}
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d INVITEs, want 1", n)
	}

	inRef := fmt.Sprintf("in-%d", time.Now().UnixNano())
	if _, err := r.bot.Dial(r.sip, "+15550002222", "+15550001111", map[string]string{"X-Call-Ref": inRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.incoming", "callRef", inRef), 2*time.Second)
	_, err = mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: inRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	wantStatus(t, err, codes.AlreadyExists, node.CodeCallExists)
}

// TestCallRefHeader: the configured header (X-Call-Ref in the rig) names calls. Outbound, its
// value in to.headers becomes the call_ref and still reaches the INVITE; a different call_ref, or
// a malformed value, is INVALID_ARGUMENT. Inbound, a well-formed value is the call_ref, and a
// malformed or missing one gets a ref from the node.
func TestCallRefHeader(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	ref := fmt.Sprintf("hdr-%d", time.Now().UnixNano())
	target := func(h map[string]string) *roomrv1.SipTarget {
		return &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(), Headers: h}
	}
	call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{To: target(map[string]string{"x-call-ref": ref})})
	if err != nil || call.CallRef != ref {
		t.Fatalf("CreateCall with the header = %v %v", call, err)
	}
	if st := r.calleeCall().Status(); st.Headers["x-call-ref"] != ref && st.Headers["X-Call-Ref"] != ref {
		t.Fatalf("INVITE headers = %v", st.Headers)
	}
	// The same value in both is one ref.
	same, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, To: target(map[string]string{"x-call-ref": ref})})
	if err != nil || same.CallRef != ref {
		t.Fatalf("call_ref equal to the header = %v %v", same, err)
	}
	_, err = mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: "other",
		To: target(map[string]string{"X-Call-Ref": "mine"})})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	_, err = mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{To: target(map[string]string{"X-Call-Ref": "a.b"})})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d INVITEs, want 1", n)
	}

	inRef := fmt.Sprintf("in-%d", time.Now().UnixNano())
	if _, err := r.bot.Dial(r.sip, "+1", "+2", map[string]string{"X-Call-Ref": inRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.incoming", "callRef", inRef), 2*time.Second)
	for i, h := range []map[string]string{{"X-Call-Ref": "bad.ref"}, {"X-Other": "1"}} {
		to := fmt.Sprintf("+1900%d", i)
		if _, err := r.bot.Dial(r.sip, to, "+2", h); err != nil {
			t.Fatal(err)
		}
		in := r.waitEvent(typed("call.incoming", "to", to), 2*time.Second)
		got, _ := in["callRef"].(string)
		if got == "" || got == "bad.ref" || got == inRef {
			t.Fatalf("headers %v: callRef %q", h, got)
		}
	}
}

// TestCreateCallDigest: a proxy that challenges the INVITE gets the digest from to.auth; wrong
// credentials end the call without a room.
func TestCreateCallDigest(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	r.callee.RequireAuth("peer", "s3cret")
	ref := fmt.Sprintf("auth-%d", time.Now().UnixNano())
	if _, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Auth: &roomrv1.SipAuth{Username: "peer", Password: "s3cret"}}}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.answered", "callRef", ref), 4*time.Second)
	if r.callee.Challenged() < 1 {
		t.Fatal("the INVITE was not challenged")
	}
	bad := fmt.Sprintf("badauth-%d", time.Now().UnixNano())
	call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: bad,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Auth: &roomrv1.SipAuth{Username: "peer", Password: "wrong"}}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.progress", "callRef", bad, "cause", "rejected"), 4*time.Second)
	roomGone(t, r, call.RoomRef)
}

// TestCreateCallHeadersByteForByte: every to.headers entry, X-DOD-Number included, is on the
// INVITE with its exact value, and the node adds none of its own.
func TestCreateCallHeadersByteForByte(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	headers := map[string]string{"X-DOD-Number": "+15550002", "X-Foo": "bar;baz=\"q u\"", "P-Asserted-Identity": "<sip:+1@x>"}
	if _, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: fmt.Sprintf("h-%d", time.Now().UnixNano()),
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(), Headers: headers}}); err != nil {
		t.Fatal(err)
	}
	st := r.calleeCall().Status()
	for k, v := range headers {
		if !strings.HasPrefix(strings.ToLower(k), "x-") {
			continue // the bot records X- headers only
		}
		if st.Headers[k] != v {
			t.Fatalf("%s = %q, want %q (all: %v)", k, st.Headers[k], v, st.Headers)
		}
	}
	if len(st.Headers) != 2 {
		t.Fatalf("INVITE X- headers = %v, want exactly the two given", st.Headers)
	}
}

// TestCreateCallDedupeWindowEnds: once the dedupe window has passed since the call ended, its
// call_ref is free again and a CreateCall with it dials anew.
func TestCreateCallDedupeWindowEnds(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.CallDedupeWindow = 300 * time.Millisecond }})
	_, mc := r.withControl(nil)
	r.callee.Callee("busy", 0)
	ref := fmt.Sprintf("window-%d", time.Now().UnixNano())
	req := &roomrv1.CreateCallRequest{CallRef: ref,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}}
	if _, err := mc.CreateCall(rpcCtx(t), req); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.progress", "callRef", ref, "cause", "busy"), 3*time.Second)
	if again, err := mc.CreateCall(rpcCtx(t), req); err != nil || again.State != roomrv1.Call_ENDED {
		t.Fatalf("within the window = %v %v", again, err)
	}
	time.Sleep(500 * time.Millisecond)
	fresh, err := mc.CreateCall(rpcCtx(t), req)
	if err != nil || fresh.State != roomrv1.Call_RINGING {
		t.Fatalf("after the window = %v %v", fresh, err)
	}
}

// End-to-end tests of CreateCall's contract with the controller: failed dials leave no room, a
// repeated call_ref is idempotent within the dedupe window and refused when its parameters
// differ, the configured call-ref header names calls both ways, a digest challenge is answered
// with to.auth, and to.headers reach the INVITE byte for byte.
package e2e

import (
	"fmt"
	"strings"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/grpc/codes"
)

// TestROM022_CreateCallFailuresLeaveNoRoom: busy, no answer and a rejection each end the call with its
// SIP status and cause; no room was ever created and no stream opened.
func TestROM022_CreateCallFailuresLeaveNoRoom(t *testing.T) {
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
			r.callee.Callee(tc.mode, 0)
			ref := fmt.Sprintf("%s-%d", tc.mode, time.Now().UnixNano())
			call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, RingTimeoutS: tc.ring,
				To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
			if err != nil || call.State != roomrv1.Call_RINGING {
				t.Fatalf("CreateCall = %v %v", call, err)
			}
			r.waitEvent(typed("call.ended", "call_ref", ref, "sip_status", tc.sip, "cause", tc.cause), 4*time.Second)
			if r.node.Participants(call.RoomRef) >= 0 || r.node.ActiveRooms() != 0 || r.app.count() != 0 {
				t.Fatalf("rooms %d, streams %d after a failed call", r.node.ActiveRooms(), r.app.count())
			}
			if ev := r.find(typed("participant.joined", "call_ref", ref)); ev != nil {
				t.Fatalf("a participant joined for a failed call: %v", ev)
			}
		})
	}
}

// TestROM024_CreateCallDedupe: within the dedupe window a repeated call_ref returns the call, also once
// it has ended, and sends no second INVITE; the same call_ref with other parameters is
// ALREADY_EXISTS, and so is the call_ref of an inbound call.
func TestROM024_CreateCallDedupe(t *testing.T) {
	r := start(t)
	ref := fmt.Sprintf("dedupe-%d", time.Now().UnixNano())
	req := &roomrv1.CreateCallRequest{CallRef: ref, Metadata: map[string]string{"k": "v"},
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Headers: map[string]string{"X-A": "1"}, Auth: &roomrv1.SipAuth{Username: "u", Password: "p"}}}
	first, err := r.mc.CreateCall(rpcCtx(t), req)
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.answered", "call_ref", ref), 3*time.Second)
	if _, err := r.mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: ref}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "room_ref", first.RoomRef), 3*time.Second)
	again, err := r.mc.CreateCall(rpcCtx(t), req)
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
		"metadata": func(q *roomrv1.CreateCallRequest) { q.Metadata = nil },
		"ring":     func(q *roomrv1.CreateCallRequest) { q.RingTimeoutS = 5 },
		"room_ref": func(q *roomrv1.CreateCallRequest) { q.RoomRef = "elsewhere" },
		"session":  func(q *roomrv1.CreateCallRequest) { q.Session = "other:50071" },
	} {
		q := &roomrv1.CreateCallRequest{CallRef: ref, Metadata: map[string]string{"k": "v"},
			To: &roomrv1.SipTarget{Uri: req.To.Uri, Proxy: req.To.Proxy, Headers: map[string]string{"X-A": "1"},
				Auth: &roomrv1.SipAuth{Username: "u", Password: "p"}}}
		change(q)
		_, err := r.mc.CreateCall(rpcCtx(t), q)
		if err == nil {
			t.Fatalf("%s changed: accepted", name)
		}
		wantStatus(t, err, codes.AlreadyExists, node.CodeCallExists)
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
	r.app.callRef(inRef)
	_, err = r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: inRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	wantStatus(t, err, codes.AlreadyExists, node.CodeCallExists)
}

// TestROM026_CallRefHeader: the configured header (X-Call-Ref in the rig) names calls. Outbound, its
// value in to.headers becomes the call_ref and still reaches the INVITE; a different call_ref, or
// a malformed value, is INVALID_ARGUMENT. Inbound, a well-formed value is the call_ref, and a
// malformed or missing one gets a ref from the node.
func TestROM026_CallRefHeader(t *testing.T) {
	r := start(t)
	ref := fmt.Sprintf("hdr-%d", time.Now().UnixNano())
	target := func(h map[string]string) *roomrv1.SipTarget {
		return &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(), Headers: h}
	}
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{To: target(map[string]string{"x-call-ref": ref})})
	if err != nil || call.CallRef != ref {
		t.Fatalf("CreateCall with the header = %v %v", call, err)
	}
	if st := r.calleeCall().Status(); st.Headers["x-call-ref"] != ref && st.Headers["X-Call-Ref"] != ref {
		t.Fatalf("INVITE headers = %v", st.Headers)
	}
	if ac := r.app.callRef(ref); ac.start.GetCallRef() != ref {
		t.Fatalf("Start.call_ref = %q", ac.start.GetCallRef())
	}
	same, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, To: target(map[string]string{"x-call-ref": ref})})
	if err != nil || same.CallRef != ref {
		t.Fatalf("call_ref equal to the header = %v %v", same, err)
	}
	_, err = r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: "other",
		To: target(map[string]string{"X-Call-Ref": "mine"})})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	_, err = r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{To: target(map[string]string{"X-Call-Ref": "a.b"})})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d INVITEs, want 1", n)
	}

	inRef := fmt.Sprintf("in-%d", time.Now().UnixNano())
	if _, err := r.bot.Dial(r.sip, "+1", "+2", map[string]string{"X-Call-Ref": inRef}); err != nil {
		t.Fatal(err)
	}
	r.app.callRef(inRef)
	r.waitEvent(typed("call.started", "call_ref", inRef), 2*time.Second)
	for i, h := range []map[string]string{{"X-Call-Ref": "bad.ref"}, {"X-Other": "1"}} {
		to := fmt.Sprintf("+1900%d", i)
		if _, err := r.bot.Dial(r.sip, to, "+2", h); err != nil {
			t.Fatal(err)
		}
		got := r.app.callTo(to[1:]).start.GetCallRef()
		if got == "" || got == "bad.ref" || got == inRef {
			t.Fatalf("headers %v: call_ref %q", h, got)
		}
	}
}

// TestROM025_CreateCallDigest: a proxy that challenges the INVITE gets the digest from to.auth; wrong
// credentials end the call without a room.
func TestROM025_CreateCallDigest(t *testing.T) {
	r := start(t)
	r.callee.RequireAuth("peer", "s3cret")
	ref := fmt.Sprintf("auth-%d", time.Now().UnixNano())
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Auth: &roomrv1.SipAuth{Username: "peer", Password: "s3cret"}}}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.answered", "call_ref", ref), 4*time.Second)
	if r.callee.Challenged() < 1 {
		t.Fatal("the INVITE was not challenged")
	}
	if ac := r.app.callRef(ref); strings.Contains(fmt.Sprint(ac.start), "s3cret") {
		t.Fatal("Start echoes to.auth")
	}
	if ev := r.find(func(ev map[string]any) bool { return strings.Contains(fmt.Sprint(ev), "s3cret") }); ev != nil {
		t.Fatalf("an event echoes to.auth: %v", ev)
	}
	bad := fmt.Sprintf("badauth-%d", time.Now().UnixNano())
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: bad,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address(),
			Auth: &roomrv1.SipAuth{Username: "peer", Password: "wrong"}}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", bad, "cause", "rejected"), 4*time.Second)
	roomGone(t, r, call.RoomRef)
}

// TestROM021_CreateCallHeadersByteForByte: every to.headers entry, X-DOD-Number included, is on the
// INVITE with its exact value, the node adds none of its own, and Start carries them.
func TestROM021_CreateCallHeadersByteForByte(t *testing.T) {
	r := start(t)
	headers := map[string]string{"X-DOD-Number": "+15550002", "X-Foo": "bar;baz=\"q u\"", "P-Asserted-Identity": "<sip:+1@x>"}
	ref := fmt.Sprintf("h-%d", time.Now().UnixNano())
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref,
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
	start := r.app.callRef(ref).start
	if start.GetDirection() != sessionv1.Start_OUTBOUND || start.GetHeaders()["X-DOD-Number"] != "+15550002" {
		t.Fatalf("Start = %v", start)
	}
}

// TestROM021_ProxyIsAParameter: two CreateCalls naming different to.proxy values each go to their own.
func TestROM021_ProxyIsAParameter(t *testing.T) {
	r := start(t)
	other := startCallee(t)
	for _, proxy := range []string{r.callee.Address(), "sip:" + other.Address()} {
		if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{
			To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: proxy}}); err != nil {
			t.Fatal(err)
		}
	}
	deadline := time.Now().Add(3 * time.Second)
	for (len(r.callee.Calls()) != 1 || len(other.Calls()) != 1) && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	if len(r.callee.Calls()) != 1 || len(other.Calls()) != 1 {
		t.Fatalf("INVITEs: %d and %d, want one each", len(r.callee.Calls()), len(other.Calls()))
	}
}

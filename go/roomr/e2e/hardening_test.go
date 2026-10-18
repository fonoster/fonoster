package e2e

// Review fixes on the SIP side (RV-B1, RV-B7, RV-B9): malformed requests, dialog matching for
// INFO, trusted INVITE sources and dialog cleanup.

import (
	"fmt"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
)

// rawRequest sends one SIP request over UDP and returns the status line of the first final
// response ("" when none arrives).
func rawRequest(t *testing.T, target, msg string) string {
	t.Helper()
	conn, err := net.Dial("udp4", target)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	local := conn.LocalAddr().String()
	msg = strings.ReplaceAll(msg, "LOCAL", local)
	if _, err := conn.Write([]byte(strings.ReplaceAll(msg, "\n", "\r\n"))); err != nil {
		t.Fatal(err)
	}
	buf := make([]byte, 4096)
	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		_ = conn.SetReadDeadline(deadline)
		n, err := conn.Read(buf)
		if err != nil {
			return ""
		}
		line, _, _ := strings.Cut(string(buf[:n]), "\r\n")
		if !strings.HasPrefix(line, "SIP/2.0 1") {
			return line
		}
	}
	return ""
}

func infoRequest(target, callID, extra string) string {
	callHdr := ""
	if callID != "" {
		callHdr = "Call-ID: " + callID + "\n"
	}
	return fmt.Sprintf(`INFO sip:medianode@%s SIP/2.0
Via: SIP/2.0/UDP LOCAL;branch=z9hG4bK%d
From: <sip:attacker@example.com>;tag=evil1
To: <sip:medianode@%s>;tag=evil2
%sCSeq: 2 INFO
Max-Forwards: 70
Content-Type: application/dtmf-relay
%sContent-Length: 10

Signal=5
`, target, time.Now().UnixNano(), target, callHdr, extra)
}

func TestMalformedInfoDoesNotKillTheNode(t *testing.T) {
	r := start(t)
	if got := rawRequest(t, r.sip, infoRequest(r.sip, "", "")); !strings.Contains(got, "400") {
		t.Fatalf("INFO without Call-ID answered %q, want 400", got)
	}
	// An answered call: an INFO with its Call-ID but foreign tags is not part of the dialog.
	call, room, _ := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, "")
	if got := rawRequest(t, r.sip, infoRequest(r.sip, call.SIPCallID(), "")); !strings.Contains(got, "481") {
		t.Fatalf("INFO with a foreign dialog answered %q, want 481", got)
	}
	time.Sleep(200 * time.Millisecond)
	if n := r.count(typed("dtmf", "roomRef", room)); n != 0 {
		t.Fatalf("%d dtmf events from an out-of-dialog INFO", n)
	}
	// The node is still alive and in-dialog INFO still works.
	call.DTMFVia("7", "info")
	r.waitEvent(typed("dtmf", "roomRef", room, "digit", "7", "source", "sip_info"), 2*time.Second)
	_ = call.Hangup()
}

func TestUntrustedSourceInviteRefused(t *testing.T) {
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) { c.TrustedSources = []string{"10.255.0.1", "192.0.2.0/24"} }})
	call, err := r.bot.Dial(r.sip, "+15550002222", "", map[string]string{"X-App-Ref": "someone-elses-app"})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 403) {
		t.Fatalf("caller statuses %v, want 403", s.SIP)
	}
	if n := r.count(typed("call.incoming")); n != 0 {
		t.Fatalf("%d call.incoming events from an untrusted source", n)
	}
}

func TestTrustedSourceInviteAccepted(t *testing.T) {
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) { c.TrustedSources = []string{"localhost", "10.0.0.0/8"} }})
	if _, err := r.bot.Dial(r.sip, "+15550002222", "", map[string]string{"X-App-Ref": "app-1"}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.incoming", "appRef", "app-1"), 2*time.Second)
}

func TestUnansweredDialogsAreClosed(t *testing.T) {
	r := start(t)
	// Rejected by the gateway.
	call, _ := r.bot.Dial(r.sip, "+1", "", nil)
	incoming := r.waitEvent(typed("call.incoming"), 2*time.Second)
	r.command(map[string]any{"type": "hangup", "id": "hx", "roomRef": incoming["roomRef"], "sipStatus": 404})
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	// Unclaimed: 503.
	r.mu.Lock()
	r.claim = false
	r.mu.Unlock()
	call2, _ := r.bot.Dial(r.sip, "+2", "", nil)
	waitStatus(t, call2, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	deadline := time.Now().Add(3 * time.Second)
	for r.ua.OpenDialogs() != 0 && time.Now().Before(deadline) {
		time.Sleep(20 * time.Millisecond)
	}
	if n := r.ua.OpenDialogs(); n != 0 {
		t.Fatalf("%d dialogs still open after two unanswered calls", n)
	}
}

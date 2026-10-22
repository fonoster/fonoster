package e2e

// Live check against a real Routr (add-roomr 2.2): two Roomr nodes register as one peer with
// least-sessions, a caller's INVITE goes through Routr's edgeport, and Routr picks the node that
// reported fewer sessions, in both directions.
//
// Run a throwaway Routr (edgeport on 15360, YAML resources, no database):
//
//	docker compose -f e2e/testdata/routr/compose.yaml up -d
//	ROUTR_EDGEPORT=127.0.0.1:15360 ROUTR_NODE_HOST=host.docker.internal \
//	  CONFORMANCE_NATS_URL=... go test ./e2e -run LiveRoutr -count=1 -v
//
// Signaling uses TCP: Docker Desktop's UDP NAT rewrites sources unpredictably. Leave a few
// seconds between runs so contacts from the last run expire.

import (
	"os"
	"testing"
	"time"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
)

func TestROM034_LiveRoutrLeastSessions(t *testing.T) {
	if os.Getenv("ROM034_LIVE") != "1" {
		// Waived (mods/conformance/catalog/waivers.json): Routr 2.15.4's location service reads
		// backend.balancingAlgorithm while the request field is algorithm, so it always round-robins
		// and this test would pass or fail by chance. Set ROM034_LIVE=1 to run it against a fixed Routr.
		t.Skip("ROM-034 waived: Routr 2.15.4 ignores least-sessions (reads backend.balancingAlgorithm, not algorithm); ROM034_LIVE=1 runs it")
	}
	edge := os.Getenv("ROUTR_EDGEPORT")
	nodeHost := os.Getenv("ROUTR_NODE_HOST")
	if edge == "" || nodeHost == "" {
		// A skipped test is Blocked, never Pass (QA catalog): CI starts the Routr in testdata/routr
		// in the go job, so this runs everywhere the e2e suite does.
		t.Fatal("set ROUTR_EDGEPORT and ROUTR_NODE_HOST to run against a live Routr")
	}
	peer := func(c *sipua.Config) {
		// Routr as one deployment of the generic registration: its least-sessions balancer reads
		// X-Session-Count.
		c.Registrations = []sipua.Registration{{Registrar: "sip:" + edge + ";transport=tcp", AOR: "sip:roomr@sip.local",
			Username: "roomr", Password: "s3cret", Expires: 4 * time.Second,
			Headers: map[string]string{"X-Session-Count": sipua.SessionsPlaceholder}}}
		c.ReregisterDelta, c.AdvertiseHost = 1, nodeHost
	}
	a := startWith(t, rigOptions{uaCfg: peer})
	b := startWith(t, rigOptions{uaCfg: peer})
	time.Sleep(time.Second) // both registered

	// Round 1: node A carries 3 rooms, node B none, so Routr must pick B. Round 2: B carries 5,
	// A still 3, so Routr must pick A (rules out "last registered wins").
	placeCall := func(loaded, light *rig, round string) {
		time.Sleep(time.Second) // the loaded node re-registers with its new count
		call, err := a.bot.DialWith(edge, "+15550001000", "+15557770000", nil,
			caller.DialOptions{RequestHost: "trunk01.acme.com", Transport: "tcp"})
		if err != nil {
			t.Fatal(err)
		}
		waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 5*time.Second)
		if n := loaded.app.count(); n != 0 {
			t.Fatalf("%s: the loaded node got %d calls", round, n)
		}
		ac := light.app.waitCall(func(*sessionv1.Start) bool { return true }, 5*time.Second)
		call.Speak("tone:1000", 400)
		time.Sleep(700 * time.Millisecond)
		if ac.m.get(1000) < 5 {
			t.Fatalf("%s: no audio through the live call", round)
		}
		_ = call.Hangup()
		light.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef()), 5*time.Second)
		t.Logf("%s: Routr chose the lighter node", round)
	}
	for i := 0; i < 3; i++ {
		a.createRoom()
	}
	placeCall(a, b, "round 1")
	a.app.mu.Lock()
	a.app.calls = nil
	a.app.mu.Unlock()
	b.app.mu.Lock()
	b.app.calls = nil
	b.app.mu.Unlock()
	for i := 0; i < 5; i++ {
		b.createRoom()
	}
	placeCall(b, a, "round 2")
}

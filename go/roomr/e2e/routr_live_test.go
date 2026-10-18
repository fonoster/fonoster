package e2e

// Live check against a real Routr (add-media-node 2.2): two media nodes register as one peer with
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

	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
)

func TestLiveRoutrLeastSessions(t *testing.T) {
	edge := os.Getenv("ROUTR_EDGEPORT")
	nodeHost := os.Getenv("ROUTR_NODE_HOST")
	if edge == "" || nodeHost == "" {
		t.Skip("set ROUTR_EDGEPORT and ROUTR_NODE_HOST to run against a live Routr")
	}
	peer := func(c *sipua.Config) {
		// Routr as one deployment of the generic registration: its least-sessions balancer reads
		// X-Session-Count.
		c.Registrations = []sipua.Registration{{Registrar: "sip:" + edge + ";transport=tcp", AOR: "sip:medianode@sip.local",
			Username: "medianode", Password: "s3cret", Expires: 4 * time.Second,
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
		in := light.waitEvent(typed("call.incoming", "appRef", "app-live"), 5*time.Second)
		if n := loaded.count(typed("call.incoming")); n != 0 {
			t.Fatalf("%s: the loaded node got %d calls", round, n)
		}
		room := in["roomRef"].(string)
		g, _ := light.addSession(room, "")
		light.command(map[string]any{"type": "answer", "id": "a-" + round, "roomRef": room})
		waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 5*time.Second)
		call.Speak("tone:1000", 400)
		time.Sleep(700 * time.Millisecond)
		if g.m.get(1000) < 5 {
			t.Fatalf("%s: no audio through the live call", round)
		}
		_ = call.Hangup()
		light.waitEvent(typed("room.ended", "roomRef", room), 5*time.Second)
		t.Logf("%s: Routr chose the lighter node", round)
	}
	for i := 0; i < 3; i++ {
		a.command(map[string]any{"type": "room.create", "id": "load"})
	}
	placeCall(a, b, "round 1")
	a.mu.Lock()
	a.events = nil
	a.mu.Unlock()
	b.mu.Lock()
	b.events = nil
	b.mu.Unlock()
	for i := 0; i < 5; i++ {
		b.command(map[string]any{"type": "room.create", "id": "load"})
	}
	placeCall(b, a, "round 2")
}

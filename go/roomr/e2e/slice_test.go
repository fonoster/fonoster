// End-to-end test of the first Roomr node slice: a SIP caller bot calls the node, the test plays
// the gateway over media-control (NATS) and exchanges RTP as the session participant. Needs NATS:
// set CONFORMANCE_NATS_URL (for example nats://127.0.0.1:4222).
package e2e

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"net"
	"os"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"github.com/nats-io/nats.go"
)

type rig struct {
	callee *caller.Bot
	t      *testing.T
	nc     *nats.Conn
	node   *node.Node
	ua     *sipua.UA
	sip    string
	bot    *caller.Bot
	mu     sync.Mutex
	events []map[string]any
	claim  bool
	// claimAs is the gatewayRef claim replies carry ("" for none).
	claimAs string
	// tlsAddr is the node's SIP-over-TLS address in encrypted runs.
	tlsAddr string
}

// freePort returns a port free for both UDP and TCP: the SIP listener binds both.
func freePort(t *testing.T) int {
	for range 20 {
		l, err := net.Listen("tcp4", "127.0.0.1:0")
		if err != nil {
			t.Fatal(err)
		}
		port := l.Addr().(*net.TCPAddr).Port
		u, err := net.ListenPacket("udp4", fmt.Sprintf("127.0.0.1:%d", port))
		_ = l.Close()
		if err == nil {
			_ = u.Close()
			return port
		}
	}
	t.Fatal("no port free for both UDP and TCP")
	return 0
}

func start(t *testing.T) *rig { return startWith(t, rigOptions{}) }

// rigOptions vary the node under test.
type rigOptions struct {
	nodeCfg func(*node.Config)
	uaCfg   func(*sipua.Config)
	botOpts caller.Options
}

func (o rigOptions) bot() caller.Options {
	b := o.botOpts
	if b.Host == "" {
		b.Host = "127.0.0.1"
	}
	return b
}

func startWith(t *testing.T, o rigOptions) *rig {
	url := os.Getenv("CONFORMANCE_NATS_URL")
	if url == "" {
		t.Skip("set CONFORMANCE_NATS_URL to run")
	}
	nc, err := nats.Connect(url)
	if err != nil {
		t.Fatal(err)
	}
	id := fmt.Sprintf("e2e-%d", time.Now().UnixNano())
	cfg := node.Config{NodeID: id, Heartbeat: 200 * time.Millisecond, ClaimTimeout: 200 * time.Millisecond,
		CallRefHeader: "X-Call-Ref"}
	if o.nodeCfg != nil {
		o.nodeCfg(&cfg)
	}
	n := node.New(nc, cfg)
	port := freePort(t)
	addr := "127.0.0.1:" + strconv.Itoa(port)
	// A second bot answers what the node dials (Routr's place in production).
	callee, err := caller.NewWithOptions(o.bot())
	if err != nil {
		t.Fatal(err)
	}
	uaCfg := sipua.Config{Listen: addr, AdvertiseHost: "127.0.0.1", AdvertisePort: port,
		OutboundProxy: callee.Address()}
	if o.uaCfg != nil {
		o.uaCfg(&uaCfg)
	}
	ua, err := sipua.New(n, uaCfg)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	go func() { _ = ua.Serve(ctx) }()
	if err := n.Start(); err != nil {
		t.Fatal(err)
	}
	bot, err := caller.NewWithOptions(o.bot())
	if err != nil {
		t.Fatal(err)
	}
	r := &rig{t: t, nc: nc, node: n, ua: ua, sip: addr, bot: bot, callee: callee, claim: true}
	record := func(m *nats.Msg) {
		var ev map[string]any
		_ = json.Unmarshal(m.Data, &ev)
		r.mu.Lock()
		r.events = append(r.events, ev)
		r.mu.Unlock()
	}
	s1, _ := nc.Subscribe("media."+id+".events.*", record)
	s2, _ := nc.Subscribe(node.IncomingSubject, func(m *nats.Msg) {
		var ev map[string]any
		_ = json.Unmarshal(m.Data, &ev)
		if ev["nodeId"] != id {
			return
		}
		r.mu.Lock()
		claim, claimAs := r.claim, r.claimAs
		r.events = append(r.events, ev)
		r.mu.Unlock()
		if claim {
			reply, _ := json.Marshal(map[string]any{"type": "claimed", "id": fmt.Sprint(ev["id"]), "gatewayRef": claimAs})
			_ = m.Respond(reply)
		}
	})
	_ = nc.Flush()
	time.Sleep(150 * time.Millisecond) // SIP listeners up
	t.Cleanup(func() {
		_ = s1.Unsubscribe()
		_ = s2.Unsubscribe()
		bot.Close()
		callee.Close()
		n.Shutdown()
		uctx, ucancel := context.WithTimeout(context.Background(), 2*time.Second)
		_ = ua.Unregister(uctx) // while the transport is still up
		ucancel()
		cancel()
		ua.Close()
		nc.Close()
	})
	return r
}

func (r *rig) waitEvent(match func(map[string]any) bool, within time.Duration) map[string]any {
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		r.mu.Lock()
		for _, ev := range r.events {
			if match(ev) {
				r.mu.Unlock()
				return ev
			}
		}
		r.mu.Unlock()
		time.Sleep(10 * time.Millisecond)
	}
	r.t.Fatalf("no matching event within %v; got %v", within, r.events)
	return nil
}

func typed(t string, kv ...any) func(map[string]any) bool {
	return func(ev map[string]any) bool {
		if ev["type"] != t {
			return false
		}
		for i := 0; i+1 < len(kv); i += 2 {
			if fmt.Sprint(ev[kv[i].(string)]) != fmt.Sprint(kv[i+1]) {
				return false
			}
		}
		return true
	}
}

func (r *rig) command(cmd map[string]any) map[string]any {
	data, _ := json.Marshal(cmd)
	msg, err := r.nc.Request("media."+r.node.ID()+".commands", data, 2*time.Second)
	if err != nil {
		r.t.Fatalf("%v: %v", cmd["type"], err)
	}
	var reply map[string]any
	_ = json.Unmarshal(msg.Data, &reply)
	return reply
}

func waitStatus(t *testing.T, c *caller.Call, ok func(caller.Status) bool, within time.Duration) caller.Status {
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		if s := c.Status(); ok(s) {
			return s
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("caller status not reached: %+v", c.Status())
	return caller.Status{}
}

func contains(list []int, v int) bool {
	for _, x := range list {
		if x == v {
			return true
		}
	}
	return false
}

func TestInboundCallSlice(t *testing.T) {
	r := start(t)
	call, err := r.bot.Dial(r.sip, "+15550002222", "+15550001111", map[string]string{
		"X-App-Ref": "app-1", "X-Call-Ref": "call-9", "X-Call-Direction": "FROM_PSTN"})
	if err != nil {
		t.Fatal(err)
	}
	incoming := r.waitEvent(typed("call.incoming", "appRef", "app-1", "callRef", "call-9", "to", "+15550002222"), 2*time.Second)
	room := incoming["roomRef"].(string)
	callerRef := incoming["participantRef"].(string)

	// ring, then the gateway's session participant, then answer.
	if rep := r.command(map[string]any{"type": "ring", "id": "r1", "roomRef": room}); rep["type"] != "ack" {
		t.Fatalf("ring: %v", rep)
	}
	waitStatus(t, call, func(s caller.Status) bool { return contains(s.SIP, 180) }, 2*time.Second)

	gw, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer gw.Close()
	var heardMu sync.Mutex
	audible := 0
	go gw.Serve(rtpio.Handlers{Audio: func(f audio.Frame) {
		var sum float64
		for _, s := range f {
			sum += float64(s) * float64(s)
		}
		if math.Sqrt(sum/float64(len(f))) > 300 {
			heardMu.Lock()
			audible++
			heardMu.Unlock()
		}
	}})
	rep := r.command(map[string]any{"type": "participant.add", "id": "s1", "roomRef": room, "kind": "session",
		"rtp": map[string]any{"host": "127.0.0.1", "port": gw.Port(), "codec": "L16/16000", "payloadType": 96, "ptime": 20, "ssrc": 1}})
	if rep["type"] != "ack" {
		t.Fatalf("participant.add: %v", rep)
	}
	block := rep["rtp"].(map[string]any)
	if err := gw.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(block["port"].(float64))); err != nil {
		t.Fatal(err)
	}
	if rep := r.command(map[string]any{"type": "answer", "id": "a1", "roomRef": room}); rep["type"] != "ack" {
		t.Fatalf("answer: %v", rep)
	}
	status := waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 2*time.Second)
	if !contains(status.SIP, 180) || !contains(status.SIP, 200) {
		t.Fatalf("caller statuses %v", status.SIP)
	}

	// The caller's tone reaches the session participant (the gateway hears the caller).
	call.Speak("tone", 400)
	time.Sleep(700 * time.Millisecond)
	heardMu.Lock()
	gotFromCaller := audible
	heardMu.Unlock()
	if gotFromCaller < 10 {
		t.Fatalf("session participant heard %d audible frames of the caller's tone", gotFromCaller)
	}

	// Agent audio reaches the caller.
	before := call.Status().AudibleMs
	tone := audio.Silence()
	for i := range tone {
		tone[i] = int16(8000 * math.Sin(2*math.Pi*440*float64(i)/audio.Rate))
	}
	for i := 0; i < 25; i++ {
		gw.Send(tone)
		time.Sleep(20 * time.Millisecond)
	}
	time.Sleep(200 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got < 300 {
		t.Fatalf("caller heard %d ms of agent audio", got)
	}

	// RFC 4733 keypress, reported once.
	call.DTMF("5")
	r.waitEvent(typed("dtmf", "digit", "5", "roomRef", room), 2*time.Second)

	// hold: the session participant stops hearing the caller.
	if rep := r.command(map[string]any{"type": "hold", "id": "h1", "roomRef": room, "participantRef": callerRef, "extra": 1}); rep["type"] != "ack" {
		t.Fatalf("hold: %v", rep)
	}
	heardMu.Lock()
	audible = 0
	heardMu.Unlock()
	call.Speak("tone", 400)
	time.Sleep(600 * time.Millisecond)
	heardMu.Lock()
	onHold := audible
	heardMu.Unlock()
	if onHold > 0 {
		t.Fatalf("session participant heard %d audible frames while the caller was on hold", onHold)
	}
	r.command(map[string]any{"type": "resume", "id": "h2", "roomRef": room, "participantRef": callerRef})

	// Unknown commands are refused.
	if rep := r.command(map[string]any{"type": "room.mute_all", "id": "x1", "roomRef": room}); rep["code"] != "unknown_command" {
		t.Fatalf("unknown command: %v", rep)
	}

	// The caller hangs up: reasons on both events.
	if err := call.Hangup(); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "participantRef", callerRef, "reason", "caller_hangup"), 2*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "caller_hangup"), 2*time.Second)
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("%d rooms still active", n)
	}
}

func TestUnclaimedCallGets503(t *testing.T) {
	r := start(t)
	r.mu.Lock()
	r.claim = false
	r.mu.Unlock()
	// The node reports the failed call on its own subject; the control plane turns it into the
	// workspace's call.failed webhook (M6: the node may not publish webhooks.events).
	appRef := fmt.Sprintf("app-unclaimed-%d", time.Now().UnixNano())
	hooks := make(chan map[string]any, 4)
	sub, err := r.nc.Subscribe(node.CallFailedSubject(r.node.ID()), func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) == nil {
			if ev["appRef"] == appRef {
				hooks <- ev
			}
		}
	})
	if err != nil {
		t.Fatal(err)
	}
	defer sub.Unsubscribe()
	call, err := r.bot.Dial(r.sip, "+15550002222", "", map[string]string{"X-App-Ref": appRef})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 503) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	r.waitEvent(typed("room.ended", "reason", "node_error", "sipStatus", 503), 2*time.Second)
	select {
	case ev := <-hooks:
		if ev["type"] != "call.failed" || ev["reason"] != "node_error" || ev["to"] != "+15550002222" ||
			ev["direction"] != "inbound" || ev["callRef"] == "" || ev["nodeId"] != r.node.ID() {
			t.Fatalf("call.failed report %v", ev)
		}
		if _, ok := ev["workspaceRef"]; ok {
			t.Fatalf("the node must not name a workspace: %v", ev)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no call.failed report from the node")
	}
}

func TestNodeHangupAndRejection(t *testing.T) {
	r := start(t)
	// Unrouted: the gateway claims, then hangs up with 404 before answering.
	call, _ := r.bot.Dial(r.sip, "+1", "", nil)
	incoming := r.waitEvent(typed("call.incoming"), 2*time.Second)
	if _, ok := incoming["appRef"]; ok {
		t.Fatalf("appRef present without X-App-Ref: %v", incoming)
	}
	room := incoming["roomRef"].(string)
	r.command(map[string]any{"type": "hangup", "id": "hx", "roomRef": room, "sipStatus": 404})
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 404) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "rejected", "sipStatus", 404), 2*time.Second)

	// Answered, then the node hangs up: the caller gets BYE.
	call2, _ := r.bot.Dial(r.sip, "+2", "", map[string]string{"X-App-Ref": "a"})
	in2 := r.waitEvent(typed("call.incoming", "to", "+2"), 2*time.Second)
	room2 := in2["roomRef"].(string)
	r.command(map[string]any{"type": "answer", "id": "a", "roomRef": room2})
	waitStatus(t, call2, func(s caller.Status) bool { return s.State == "answered" }, 2*time.Second)
	r.command(map[string]any{"type": "hangup", "id": "h", "roomRef": room2})
	waitStatus(t, call2, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room2, "reason", "removed", "id", "h"), 2*time.Second)
}

func TestHeartbeats(t *testing.T) {
	r := start(t)
	sub, _ := r.nc.SubscribeSync(node.HeartbeatSubject(r.node.ID()))
	defer sub.Unsubscribe()
	msg, err := sub.NextMsg(time.Second)
	if err != nil {
		t.Fatal(err)
	}
	var hb map[string]any
	_ = json.Unmarshal(msg.Data, &hb)
	if hb["type"] != "node.heartbeat" {
		t.Fatalf("heartbeat %v", hb)
	}
}

// answeredCall places an answered call with a session participant and returns its room.
func (r *rig) answeredCall() (*caller.Call, string, *rtpio.Endpoint) {
	to := fmt.Sprintf("+1%d", time.Now().UnixNano()%1e9)
	call, err := r.bot.Dial(r.sip, to, "", map[string]string{"X-App-Ref": "app-1"})
	if err != nil {
		r.t.Fatal(err)
	}
	in := r.waitEvent(typed("call.incoming", "to", to), 2*time.Second)
	room := in["roomRef"].(string)
	gw, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		r.t.Fatal(err)
	}
	go gw.Serve(rtpio.Handlers{})
	rep := r.command(map[string]any{"type": "participant.add", "id": "s-" + room, "roomRef": room, "kind": "session",
		"rtp": map[string]any{"host": "127.0.0.1", "port": gw.Port(), "codec": "L16/16000"}})
	block := rep["rtp"].(map[string]any)
	_ = gw.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(block["port"].(float64)))
	r.command(map[string]any{"type": "answer", "id": "a-" + room, "roomRef": room})
	waitStatus(r.t, call, func(s caller.Status) bool { return s.State == "answered" }, 2*time.Second)
	r.t.Cleanup(gw.Close)
	return call, room, gw
}

func TestDialIntoRoom(t *testing.T) {
	r := start(t)
	reply := r.command(map[string]any{"type": "room.create", "id": "c1"})
	room := reply["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+15551234567"})
	r.waitEvent(typed("call.progress", "id", "d1", "status", "ringing"), 2*time.Second)
	r.waitEvent(typed("call.answered", "id", "d1"), 3*time.Second)
	joined := r.waitEvent(typed("participant.joined", "id", "d1"), 2*time.Second)

	// The dialed party hangs up: callee_hangup, and the room ends with it.
	time.Sleep(100 * time.Millisecond)
	calls := r.callee.Calls()
	if len(calls) != 1 {
		t.Fatalf("callee saw %d calls", len(calls))
	}
	if err := r.callee.Get(calls[0].ID).Hangup(); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "participantRef", joined["participantRef"], "reason", "callee_hangup"), 2*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "callee_hangup"), 2*time.Second)
}

// TestDialAsPeer: the node dials as its Routr Peer (OB-B1). The callee bot stands in for Routr: it
// challenges the INVITE, and the answered INVITE has the Peer in From and the caller-id number in
// X-DOD-Number, which is what Routr's PEER_TO_PSTN routing needs.
func TestDialAsPeer(t *testing.T) {
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		// The Peer the node registers as (its first registration's AOR and auth).
		c.Registrations = []sipua.Registration{{Registrar: startRegistrar(t, "", "").addr,
			AOR: "sip:roomr@default", Username: "roomr", Password: "peer-secret"}}
	}})
	r.callee.RequireAuth("roomr", "peer-secret")
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+15551234567",
		"from": "+17853178070", "headers": map[string]any{"X-Call-Ref": "call-1"}})
	r.waitEvent(typed("call.answered", "id", "d1"), 3*time.Second)
	if got := r.callee.Challenged(); got != 1 {
		t.Fatalf("callee challenged %d INVITEs, want 1", got)
	}
	calls := r.callee.Calls()
	if len(calls) != 1 {
		t.Fatalf("callee saw %d calls", len(calls))
	}
	st := calls[0]
	if !strings.HasPrefix(st.From, "sip:roomr@default") {
		t.Fatalf("From = %q, want the Peer sip:roomr@default", st.From)
	}
	if st.Headers[sipua.DODNumberHeader] != "+17853178070" || st.Headers["X-Call-Ref"] != "call-1" {
		t.Fatalf("headers = %v", st.Headers)
	}
}

// TestDialAsPeerBadSecret: a wrong Peer password fails the dial with the proxy's 401.
func TestDialAsPeerBadSecret(t *testing.T) {
	r := startWith(t, rigOptions{uaCfg: func(c *sipua.Config) {
		c.Registrations = []sipua.Registration{{Registrar: startRegistrar(t, "", "").addr, Username: "roomr",
			Password: "wrong"}}
	}})
	r.callee.RequireAuth("roomr", "peer-secret")
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d1", "roomRef": room, "to": "+1555", "from": "+1785"})
	r.waitEvent(typed("call.progress", "id", "d1", "status", "failed", "sipStatus", 401), 3*time.Second)
}

func TestDialBusy(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	r.command(map[string]any{"type": "participant.dial", "id": "d2", "roomRef": room, "to": "+1"})
	r.waitEvent(typed("call.progress", "id", "d2", "status", "busy", "sipStatus", 486), 3*time.Second)
}

func TestColdTransfer(t *testing.T) {
	r := start(t)
	call, room, _ := r.answeredCall()
	r.command(map[string]any{"type": "transfer", "id": "t1", "roomRef": room, "to": "+15551234567", "mode": "cold"})
	joined := r.waitEvent(typed("participant.joined", "id", "t1"), 3*time.Second)
	r.waitEvent(typed("participant.left", "id", "t1", "reason", "removed"), 2*time.Second)
	r.waitEvent(typed("transfer.result", "id", "t1", "status", "completed"), 2*time.Second)

	// The caller and the new party hear each other through the room.
	time.Sleep(100 * time.Millisecond)
	callee := r.callee.Get(r.callee.Calls()[0].ID)
	before := callee.Status().AudibleMs
	call.Speak("tone", 400)
	time.Sleep(700 * time.Millisecond)
	if got := callee.Status().AudibleMs - before; got < 200 {
		t.Fatalf("new party heard %d ms of the caller", got)
	}
	_ = joined
	// The caller hangs up: the new party gets BYE and the room ends.
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "roomRef", room), 2*time.Second)
	waitStatus(t, callee, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

func TestWarmTransfer(t *testing.T) {
	r := start(t)
	_, room, _ := r.answeredCall()
	r.command(map[string]any{"type": "transfer", "id": "t2", "roomRef": room, "to": "+1", "mode": "warm"})
	if !r.node.Held(room) {
		time.Sleep(50 * time.Millisecond)
		if !r.node.Held(room) {
			t.Fatal("caller not on hold during a warm transfer")
		}
	}
	r.waitEvent(typed("participant.joined", "id", "t2"), 3*time.Second)
	r.command(map[string]any{"type": "transfer.complete", "id": "t2", "roomRef": room})
	r.waitEvent(typed("participant.left", "reason", "removed", "roomRef", room), 2*time.Second)
	r.waitEvent(typed("transfer.result", "id", "t2", "status", "completed"), 2*time.Second)
	if r.node.Held(room) {
		t.Fatal("caller still on hold after transfer.complete")
	}
}

func TestWarmTransferNotAnswered(t *testing.T) {
	r := start(t)
	node.WarmTransferTimeout = 500 * time.Millisecond
	defer func() { node.WarmTransferTimeout = 30 * time.Second }()
	r.callee.Callee("no_answer", 0)
	_, room, _ := r.answeredCall()
	r.command(map[string]any{"type": "transfer", "id": "t3", "roomRef": room, "to": "+1", "mode": "warm"})
	r.waitEvent(typed("transfer.result", "id", "t3", "status", "failed"), 3*time.Second)
	if r.node.Held(room) {
		t.Fatal("caller still on hold after a failed warm transfer")
	}
}

func TestReferTransfer(t *testing.T) {
	r := start(t)
	_, room, _ := r.answeredCall()
	r.command(map[string]any{"type": "transfer", "id": "t4", "roomRef": room, "to": "+15551234567", "mode": "refer"})
	r.waitEvent(typed("transfer.result", "id", "t4", "status", "referred"), 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
	if refers := r.bot.Refers(); len(refers) != 1 || refers[0] != "<tel:+15551234567>" {
		t.Fatalf("refers %v", refers)
	}
}

func TestListenerGetsTracksUnmixed(t *testing.T) {
	r := start(t)
	call, room, gw := r.answeredCall()
	// Listen to the caller's track (1) only.
	tap, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer tap.Close()
	_ = tap.Configure(audio.L16{}, 96, -1, "127.0.0.1", 9)
	var mu sync.Mutex
	audible := 0
	go tap.Serve(rtpio.Handlers{Audio: func(f audio.Frame) {
		var sum float64
		for _, s := range f {
			sum += float64(s) * float64(s)
		}
		if math.Sqrt(sum/float64(len(f))) > 300 {
			mu.Lock()
			audible++
			mu.Unlock()
		}
	}})
	rep := r.command(map[string]any{"type": "listener.attach", "id": "l1", "roomRef": room,
		"tracks": []any{map[string]any{"trackId": 1, "rtp": map[string]any{"host": "127.0.0.1", "port": tap.Port(), "codec": "L16/16000"}}}})
	if rep["type"] != "ack" || rep["listenerRef"] == nil {
		t.Fatalf("listener.attach: %v", rep)
	}
	// Agent audio (track 2) must not reach a listener of track 1.
	tone := audio.Silence()
	for i := range tone {
		tone[i] = int16(8000 * math.Sin(2*math.Pi*440*float64(i)/audio.Rate))
	}
	for i := 0; i < 20; i++ {
		gw.Send(tone)
		time.Sleep(20 * time.Millisecond)
	}
	time.Sleep(100 * time.Millisecond)
	mu.Lock()
	fromAgent := audible
	audible = 0
	mu.Unlock()
	if fromAgent > 0 {
		t.Fatalf("listener of the caller's track heard %d frames of agent audio", fromAgent)
	}
	call.Speak("tone", 400)
	time.Sleep(700 * time.Millisecond)
	mu.Lock()
	fromCaller := audible
	mu.Unlock()
	if fromCaller < 10 {
		t.Fatalf("listener heard %d frames of the caller", fromCaller)
	}
	if rep := r.command(map[string]any{"type": "listener.detach", "id": "l2", "roomRef": room, "listenerRef": rep["listenerRef"]}); rep["type"] != "ack" {
		t.Fatalf("listener.detach: %v", rep)
	}
}

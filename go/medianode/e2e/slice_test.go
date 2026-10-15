// End-to-end test of the first media node slice: a SIP caller bot calls the node, the test plays
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
	"sync"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/fonoster/fonoster/go/medianode/internal/caller"
	"github.com/fonoster/fonoster/go/medianode/internal/node"
	"github.com/fonoster/fonoster/go/medianode/internal/rtpio"
	"github.com/fonoster/fonoster/go/medianode/internal/sipua"
	"github.com/nats-io/nats.go"
)

type rig struct {
	t      *testing.T
	nc     *nats.Conn
	node   *node.Node
	sip    string
	bot    *caller.Bot
	mu     sync.Mutex
	events []map[string]any
	claim  bool
}

func freePort(t *testing.T) int {
	l, err := net.ListenPacket("udp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()
	return l.LocalAddr().(*net.UDPAddr).Port
}

func start(t *testing.T) *rig {
	url := os.Getenv("CONFORMANCE_NATS_URL")
	if url == "" {
		t.Skip("set CONFORMANCE_NATS_URL to run")
	}
	nc, err := nats.Connect(url)
	if err != nil {
		t.Fatal(err)
	}
	id := fmt.Sprintf("e2e-%d", time.Now().UnixNano())
	n := node.New(nc, node.Config{NodeID: id, Heartbeat: 200 * time.Millisecond, ClaimTimeout: 200 * time.Millisecond})
	port := freePort(t)
	addr := "127.0.0.1:" + strconv.Itoa(port)
	ua, err := sipua.New(n, sipua.Config{Listen: addr, AdvertiseHost: "127.0.0.1", AdvertisePort: port})
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	go func() { _ = ua.Serve(ctx) }()
	if err := n.Start(); err != nil {
		t.Fatal(err)
	}
	bot, err := caller.New("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	r := &rig{t: t, nc: nc, node: n, sip: addr, bot: bot, claim: true}
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
		claim := r.claim
		r.events = append(r.events, ev)
		r.mu.Unlock()
		if claim {
			_ = m.Respond([]byte(`{"type":"claimed","id":"` + fmt.Sprint(ev["id"]) + `"}`))
		}
	})
	_ = nc.Flush()
	time.Sleep(150 * time.Millisecond) // SIP listeners up
	t.Cleanup(func() {
		_ = s1.Unsubscribe()
		_ = s2.Unsubscribe()
		bot.Close()
		n.Shutdown()
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
	call, err := r.bot.Dial(r.sip, "+15550002222", "", map[string]string{"X-App-Ref": "app-1"})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 503) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	r.waitEvent(typed("room.ended", "reason", "node_error", "sipStatus", 503), 2*time.Second)
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
	sub, _ := r.nc.SubscribeSync("media." + r.node.ID() + ".heartbeat")
	defer sub.Unsubscribe()
	msg, err := sub.NextMsg(time.Second)
	if err != nil {
		t.Fatal(err)
	}
	var hb map[string]any
	_ = json.Unmarshal(msg.Data, &hb)
	if hb["type"] != "node.heartbeat" || hb["draining"] != false {
		t.Fatalf("heartbeat %v", hb)
	}
}

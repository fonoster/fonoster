// End-to-end tests of the Roomr node (redesign-roomr). The rig runs one node in process with its
// SIP user agent, its Roomr gRPC server (the test is the controller), a fake session endpoint
// (fakeApp: a gRPC Session server that answers, rejects, stalls or is killed, and records Start,
// Dtmf and events), a caller bot that calls the node and a callee bot that answers what the node
// dials. Needs NATS for events and heartbeats: set CONFORMANCE_NATS_URL (for example
// nats://127.0.0.1:4222).
package e2e

import (
	"context"
	"crypto/tls"
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

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/control"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"github.com/nats-io/nats.go"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/keepalive"
	"google.golang.org/grpc/status"
)

// ---- the fake session endpoint ---------------------------------------------------------------

// Fake session endpoint modes (conformance "Fake session endpoint modes").
const (
	modeAnswer = "answer" // Answer (inbound) or Ready (outbound) with an RTP endpoint
	modeReject = "reject" // Reject with rejectStatus (inbound)
	modeStall  = "stall"  // keep the stream open, send nothing
	modeKill   = "kill"   // fail the stream at once
)

// fakeApp serves Session.Connect like AppBridge behind its Service.
type fakeApp struct {
	sessionv1.UnimplementedSessionServer
	t    *testing.T
	addr string
	srv  *grpc.Server

	mu           sync.Mutex
	mode         string
	rejectStatus uint32
	srtp         bool
	maxDurationS uint32
	delay        time.Duration
	calls        []*appCall
}

// appCall is one control stream the fake app accepted, with the app's RTP leg once it answered.
type appCall struct {
	app    *fakeApp
	start  *sessionv1.Start
	stream sessionv1.Session_ConnectServer
	sendMu sync.Mutex

	mu    sync.Mutex
	msgs  []*sessionv1.NodeMessage
	queue []audio.Frame
	muted bool

	ep       *rtpio.Endpoint
	m        *meter
	recvDone chan struct{}
	kill     chan struct{}
	killOnce sync.Once
}

func startApp(t *testing.T) *fakeApp {
	lis, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	// The node pings every 10 s; a server must allow it (AppBridge too).
	srv := grpc.NewServer(grpc.KeepaliveEnforcementPolicy(keepalive.EnforcementPolicy{MinTime: 5 * time.Second,
		PermitWithoutStream: true}))
	a := &fakeApp{t: t, addr: lis.Addr().String(), srv: srv, mode: modeAnswer, rejectStatus: 404}
	sessionv1.RegisterSessionServer(srv, a)
	go func() { _ = srv.Serve(lis) }()
	t.Cleanup(srv.Stop)
	return a
}

func (a *fakeApp) setMode(mode string) {
	a.mu.Lock()
	a.mode = mode
	a.mu.Unlock()
}

// Connect is the node's control stream for one call.
func (a *fakeApp) Connect(stream sessionv1.Session_ConnectServer) error {
	first, err := stream.Recv()
	if err != nil {
		return err
	}
	start := first.GetStart()
	if start == nil {
		return status.Error(codes.InvalidArgument, "Start must be the first message")
	}
	ac := &appCall{app: a, start: start, stream: stream, m: newMeter(), recvDone: make(chan struct{}),
		kill: make(chan struct{})}
	a.mu.Lock()
	a.calls = append(a.calls, ac)
	mode, reject, srtp, maxDur, delay := a.mode, a.rejectStatus, a.srtp, a.maxDurationS, a.delay
	a.mu.Unlock()
	go func() {
		defer close(ac.recvDone)
		for {
			m, err := stream.Recv()
			if err != nil {
				return
			}
			ac.mu.Lock()
			ac.msgs = append(ac.msgs, m)
			ac.mu.Unlock()
		}
	}()
	switch mode {
	case modeKill:
		return status.Error(codes.Unavailable, "killed")
	case modeReject:
		ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Reject{Reject: &sessionv1.Reject{SipStatus: reject}}})
	case modeAnswer:
		if delay > 0 {
			time.Sleep(delay)
		}
		ac.answer(srtp, maxDur)
	}
	select {
	case <-ac.recvDone:
		return nil
	case <-ac.kill:
		return status.Error(codes.Unavailable, "killed")
	}
}

// waitCall waits for a stream whose Start matches.
func (a *fakeApp) waitCall(match func(*sessionv1.Start) bool, within time.Duration) *appCall {
	a.t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		a.mu.Lock()
		for _, c := range a.calls {
			if match(c.start) {
				a.mu.Unlock()
				return c
			}
		}
		a.mu.Unlock()
		time.Sleep(10 * time.Millisecond)
	}
	a.t.Fatalf("no control stream matched within %v", within)
	return nil
}

func (a *fakeApp) callTo(to string) *appCall {
	norm := func(s string) string { return strings.TrimPrefix(s, "+") }
	return a.waitCall(func(s *sessionv1.Start) bool { return norm(s.GetTo()) == norm(to) }, 3*time.Second)
}

func (a *fakeApp) callRef(ref string) *appCall {
	return a.waitCall(func(s *sessionv1.Start) bool { return s.GetCallRef() == ref }, 5*time.Second)
}

func (a *fakeApp) count() int {
	a.mu.Lock()
	defer a.mu.Unlock()
	return len(a.calls)
}

func (c *appCall) send(m *sessionv1.AppMessage) {
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	_ = c.stream.Send(m)
}

// answer opens the app's RTP leg toward the node's endpoint in Start and sends Answer (inbound)
// or Ready (outbound); the leg sends silence every 20 ms unless muted, like AppBridge.
func (c *appCall) answer(srtp bool, maxDurationS uint32) {
	ep, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		c.app.t.Error(err)
		return
	}
	nodeMedia := c.start.GetMedia()
	_ = ep.Configure(audio.L16{}, 96, -1, nodeMedia.GetIp(), int(nodeMedia.GetPort()))
	key := ""
	if srtp {
		key = rtpio.NewSRTPKey()
		if err := ep.SetSRTP(key, nodeMedia.GetSrtpKey()); err != nil {
			c.app.t.Error(err)
		}
	}
	c.mu.Lock()
	c.ep = ep
	c.mu.Unlock()
	go ep.Serve(rtpio.Handlers{Audio: c.m.hear})
	go c.talk()
	media := &sessionv1.MediaEndpoint{Ip: "127.0.0.1", Port: uint32(ep.Port()), Codec: audio.NameL16, SrtpKey: key}
	if c.start.GetDirection() == sessionv1.Start_OUTBOUND {
		c.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Ready{Ready: &sessionv1.Ready{Media: media}}})
		return
	}
	c.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Answer{Answer: &sessionv1.Answer{Media: media,
		MaxDurationS: maxDurationS}}})
}

// answerNow answers a stalled call.
func (c *appCall) answerNow() { c.answer(false, 0) }

func (c *appCall) talk() {
	t := time.NewTicker(audio.FrameMs * time.Millisecond)
	defer t.Stop()
	for {
		select {
		case <-c.recvDone:
			return
		case <-c.kill:
			return
		case <-t.C:
		}
		c.mu.Lock()
		muted := c.muted
		var f audio.Frame
		if len(c.queue) > 0 {
			f, c.queue = c.queue[0], c.queue[1:]
		}
		ep := c.ep
		c.mu.Unlock()
		if muted || ep == nil {
			continue
		}
		if f == nil {
			f = audio.Silence()
		}
		ep.Send(f)
	}
}

// play sends a tone (or silence with freq 0) for ms milliseconds and returns when it is out.
func (c *appCall) play(freq float64, ms int) {
	frames := make([]audio.Frame, 0, ms/audio.FrameMs)
	for i := 0; i < ms/audio.FrameMs; i++ {
		if freq == 0 {
			frames = append(frames, audio.Silence())
		} else {
			frames = append(frames, toneFrame(freq, i))
		}
	}
	c.mu.Lock()
	c.queue = frames
	c.mu.Unlock()
	time.Sleep(time.Duration(ms+40) * time.Millisecond)
}

// mute stops the app's RTP (the stream stays open).
func (c *appCall) mute() {
	c.mu.Lock()
	c.muted = true
	c.mu.Unlock()
}

// killStream fails the stream, as when the app pod dies.
func (c *appCall) killStream() { c.killOnce.Do(func() { close(c.kill) }) }

func (c *appCall) closed() bool {
	select {
	case <-c.recvDone:
		return true
	default:
		return false
	}
}

func (c *appCall) waitClosed(t *testing.T, within time.Duration) {
	t.Helper()
	select {
	case <-c.recvDone:
	case <-time.After(within):
		t.Fatal("the control stream did not close")
	}
}

// waitMsg waits for a message from the node that matches.
func (c *appCall) waitMsg(t *testing.T, match func(*sessionv1.NodeMessage) bool, within time.Duration) *sessionv1.NodeMessage {
	t.Helper()
	deadline := time.Now().Add(within)
	for time.Now().Before(deadline) {
		c.mu.Lock()
		for _, m := range c.msgs {
			if match(m) {
				c.mu.Unlock()
				return m
			}
		}
		c.mu.Unlock()
		time.Sleep(10 * time.Millisecond)
	}
	c.mu.Lock()
	defer c.mu.Unlock()
	t.Fatalf("no matching message on the stream within %v; got %v", within, c.msgs)
	return nil
}

func (c *appCall) countMsgs(match func(*sessionv1.NodeMessage) bool) int {
	c.mu.Lock()
	defer c.mu.Unlock()
	n := 0
	for _, m := range c.msgs {
		if match(m) {
			n++
		}
	}
	return n
}

// ended waits for Ended on the stream.
func (c *appCall) ended(t *testing.T, within time.Duration) *sessionv1.Ended {
	t.Helper()
	return c.waitMsg(t, func(m *sessionv1.NodeMessage) bool { return m.GetEvent().GetEnded() != nil }, within).GetEvent().GetEnded()
}

func dtmfMsg(digit, source string) func(*sessionv1.NodeMessage) bool {
	return func(m *sessionv1.NodeMessage) bool {
		d := m.GetDtmf()
		return d != nil && (digit == "" || d.GetDigit() == digit) && (source == "" || d.GetSource() == source)
	}
}

func transferMsg(st string) func(*sessionv1.NodeMessage) bool {
	return func(m *sessionv1.NodeMessage) bool {
		r := m.GetEvent().GetTransferResult()
		return r != nil && (st == "" || r.GetStatus() == st)
	}
}

func joinedMsg(ref string) func(*sessionv1.NodeMessage) bool {
	return func(m *sessionv1.NodeMessage) bool {
		j := m.GetEvent().GetParticipantJoined()
		return j != nil && (ref == "" || j.GetParticipantRef() == ref)
	}
}

func leftMsg(cause string) func(*sessionv1.NodeMessage) bool {
	return func(m *sessionv1.NodeMessage) bool {
		l := m.GetEvent().GetParticipantLeft()
		return l != nil && (cause == "" || l.GetCause() == cause)
	}
}

// ---- the rig ------------------------------------------------------------------------------------

type rig struct {
	t      *testing.T
	nc     *nats.Conn
	node   *node.Node
	ua     *sipua.UA
	sip    string
	bot    *caller.Bot
	callee *caller.Bot
	app    *fakeApp
	// mc is the controller's Roomr client.
	mc     roomrv1.RoomrClient
	mu     sync.Mutex
	events []map[string]any
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
	app := startApp(t)
	// A second bot answers what the node dials (the SIP proxy's place in production).
	callee, err := caller.NewWithOptions(o.bot())
	if err != nil {
		t.Fatal(err)
	}
	id := fmt.Sprintf("e2e-%d", time.Now().UnixNano())
	cfg := node.Config{NodeID: id, RTPHost: "127.0.0.1", Heartbeat: 200 * time.Millisecond, CallRefHeader: "X-Call-Ref",
		SessionEndpoint: app.addr, OutboundProxy: "sip:" + callee.Address()}
	if o.nodeCfg != nil {
		o.nodeCfg(&cfg)
	}
	n := node.New(nc, cfg)
	port := freePort(t)
	addr := "127.0.0.1:" + strconv.Itoa(port)
	uaCfg := sipua.Config{Listen: addr, AdvertiseHost: "127.0.0.1", AdvertisePort: port, OutboundProxy: cfg.OutboundProxy}
	if o.uaCfg != nil {
		o.uaCfg(&uaCfg)
	}
	ua, err := sipua.New(n, uaCfg)
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	go func() { _ = ua.Serve(ctx) }()
	_ = n.Start()
	bot, err := caller.NewWithOptions(o.bot())
	if err != nil {
		t.Fatal(err)
	}
	r := &rig{t: t, nc: nc, node: n, ua: ua, sip: addr, bot: bot, callee: callee, app: app}
	record := func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) != nil || ev["node_ref"] != id || ev["type"] == "node.heartbeat" {
			return
		}
		ev["subject"] = m.Subject
		r.mu.Lock()
		r.events = append(r.events, ev)
		r.mu.Unlock()
	}
	s1, _ := nc.Subscribe("roomr.events.>", record)
	s2, _ := nc.Subscribe("roomr.nodes."+id+".>", record)
	_ = nc.Flush()
	_, r.mc = r.withControl(nil)
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

// withControl serves Roomr for the rig's node on a loopback port and returns a client.
func (r *rig) withControl(tlsConfig *tls.Config) (*control.Server, roomrv1.RoomrClient) {
	s, err := control.Listen("127.0.0.1:0", r.node, tlsConfig, nil)
	if err != nil {
		r.t.Fatal(err)
	}
	go func() { _ = s.Serve() }()
	r.t.Cleanup(s.Stop)
	return s, roomrv1.NewRoomrClient(dialInsecure(r.t, s.Addr()))
}

func (r *rig) waitEvent(match func(map[string]any) bool, within time.Duration) map[string]any {
	r.t.Helper()
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
	r.mu.Lock()
	defer r.mu.Unlock()
	r.t.Fatalf("no matching event within %v; got %v", within, r.events)
	return nil
}

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

func (r *rig) count(match func(map[string]any) bool) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	n := 0
	for _, ev := range r.events {
		if match(ev) {
			n++
		}
	}
	return n
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

func waitStatus(t *testing.T, c *caller.Call, ok func(caller.Status) bool, within time.Duration) caller.Status {
	t.Helper()
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

func rpcCtx(t *testing.T) context.Context {
	c, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	t.Cleanup(cancel)
	return c
}

// answeredCallWith places an inbound call with a chosen offer, the app answering (with SRTP on
// its leg when srtp); it returns the caller and the app's side.
func (r *rig) answeredCallWith(o caller.DialOptions, srtp bool) (*caller.Call, *appCall) {
	r.t.Helper()
	r.app.mu.Lock()
	r.app.srtp = srtp
	r.app.mu.Unlock()
	to := fmt.Sprintf("+1%d", time.Now().UnixNano()%1e9)
	call, err := r.bot.DialWith(r.sipTarget(o.Transport), to, "", map[string]string{"X-App-Ref": "app-1"}, o)
	if err != nil {
		r.t.Fatal(err)
	}
	ac := r.app.callTo(to)
	waitStatus(r.t, call, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	return call, ac
}

// answeredCall is answeredCallWith the bot's default offer, plain RTP.
func (r *rig) answeredCall() (*caller.Call, *appCall) {
	return r.answeredCallWith(caller.DialOptions{}, false)
}

func (r *rig) sipTarget(transport string) string {
	if transport == "tls" && r.tlsAddr != "" {
		return r.tlsAddr
	}
	return r.sip
}

// calleeCall waits for the callee bot's one answered call.
func (r *rig) calleeCall() *caller.Call {
	r.t.Helper()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if calls := r.callee.Calls(); len(calls) == 1 && calls[0].State != "calling" {
			return r.callee.Get(calls[0].ID)
		}
		time.Sleep(10 * time.Millisecond)
	}
	r.t.Fatalf("callee calls: %+v", r.callee.Calls())
	return nil
}

func roomGone(t *testing.T, r *rig, room string) {
	t.Helper()
	deadline := time.Now().Add(2 * time.Second)
	for r.node.Participants(room) >= 0 {
		if time.Now().After(deadline) {
			t.Fatalf("room %s still up", room)
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func metadataOf(ev map[string]any) map[string]any {
	l, _ := ev["metadata"].(map[string]any)
	return l
}

// ---- audio helpers ------------------------------------------------------------------------------

// meter counts what an RTP receiver hears: audible frames, and frames where a frequency dominates.
type meter struct {
	mu      sync.Mutex
	audible int
	freqs   map[float64]int
}

func newMeter() *meter { return &meter{freqs: map[float64]int{}} }

func toneRatio(f audio.Frame, freq float64) float64 {
	k := 2 * math.Cos(2*math.Pi*freq/audio.Rate)
	var s1, s2, energy float64
	for _, x := range f {
		s := float64(x) + k*s1 - s2
		s2, s1 = s1, s
		energy += float64(x) * float64(x)
	}
	if energy == 0 {
		return 0
	}
	return (s1*s1 + s2*s2 - k*s1*s2) / (energy * float64(len(f)) / 2)
}

func rms(f audio.Frame) float64 {
	var sum float64
	for _, s := range f {
		sum += float64(s) * float64(s)
	}
	return math.Sqrt(sum / float64(len(f)))
}

func (m *meter) hear(f audio.Frame) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if rms(f) <= 300 {
		return
	}
	m.audible++
	for _, freq := range []float64{600, 1000, 440, 6000} {
		if toneRatio(f, freq) > 0.2 {
			m.freqs[freq]++
		}
	}
}

func (m *meter) reset() {
	m.mu.Lock()
	m.audible, m.freqs = 0, map[float64]int{}
	m.mu.Unlock()
}

func (m *meter) get(freq float64) int {
	m.mu.Lock()
	defer m.mu.Unlock()
	if freq == 0 {
		return m.audible
	}
	return m.freqs[freq]
}

func toneFrame(freq float64, i int) audio.Frame {
	f := audio.Silence()
	for j := range f {
		n := float64(i*audio.FrameSamples + j)
		f[j] = int16(6000 * math.Sin(2*math.Pi*freq*n/audio.Rate))
	}
	return f
}

// rtpParty is an RTP participant added with AddParticipant, played by the test.
type rtpParty struct {
	ep  *rtpio.Endpoint
	m   *meter
	ref string
}

// join adds an L16 RTP participant to a room; srtpKey, when set, encrypts its leg.
func (r *rig) join(room, srtpKey string) (*rtpParty, *roomrv1.Participant, error) {
	ep, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		r.t.Fatal(err)
	}
	r.t.Cleanup(ep.Close)
	g := &rtpParty{ep: ep, m: newMeter()}
	p, err := r.mc.AddParticipant(rpcCtx(r.t), &roomrv1.AddParticipantRequest{RoomRef: room, Endpoint: &roomrv1.AddParticipantRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: uint32(ep.Port()), Codec: audio.NameL16, SrtpKey: srtpKey}}})
	if err != nil {
		return g, nil, err
	}
	g.ref = p.ParticipantRef
	_ = ep.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(p.GetRtp().GetPort()))
	if k := p.GetRtp().GetSrtpKey(); k != "" {
		if err := ep.SetSRTP(srtpKey, k); err != nil {
			r.t.Fatal(err)
		}
	}
	go ep.Serve(rtpio.Handlers{Audio: g.m.hear})
	return g, p, nil
}

// play sends a tone (or silence with freq 0) for ms milliseconds at real-time pace.
func (g *rtpParty) play(freq float64, ms int) {
	for i := 0; i < ms/audio.FrameMs; i++ {
		if freq == 0 {
			g.ep.Send(audio.Silence())
		} else {
			g.ep.Send(toneFrame(freq, i))
		}
		time.Sleep(audio.FrameMs * time.Millisecond)
	}
}

func dialInsecure(t *testing.T, addr string) *grpc.ClientConn {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	return conn
}

func envNATS() string { return os.Getenv("CONFORMANCE_NATS_URL") }

// startCallee starts another callee bot (a second proxy or trunk).
func startCallee(t *testing.T) *caller.Bot {
	b, err := caller.NewWithOptions(caller.Options{Host: "127.0.0.1"})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(b.Close)
	return b
}

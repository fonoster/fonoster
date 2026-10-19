package e2e

// Media tests: codecs, DTMF three ways, mix-minus, limits, encryption, drain and maximum duration
// (add-roomr tasks 1.4, 2.4, 2.5, 2.10, 2.12, 2.13).

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"fmt"
	"math"
	"math/big"
	"net"
	"strconv"
	"sync"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
)

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

// appbridge is a session participant played by the test: an RTP endpoint and what it hears.
type appbridge struct {
	ep  *rtpio.Endpoint
	m   *meter
	ref string
}

// addSession adds an L16 session participant; srtpKey, when set, is offered as AppBridge's key.
func (r *rig) addSession(room, srtpKey string) (*appbridge, map[string]any) {
	ep, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		r.t.Fatal(err)
	}
	r.t.Cleanup(ep.Close)
	g := &appbridge{ep: ep, m: newMeter()}
	block := map[string]any{"host": "127.0.0.1", "port": ep.Port(), "codec": "L16/16000", "payloadType": 96, "ptime": 20, "ssrc": 7}
	if srtpKey != "" {
		block["srtp"] = map[string]any{"suite": rtpio.SRTPSuite, "key": srtpKey}
	}
	rep := r.command(map[string]any{"type": "participant.add", "id": fmt.Sprintf("s-%d", time.Now().UnixNano()),
		"roomRef": room, "kind": "session", "rtp": block})
	if rep["type"] != "ack" {
		return g, rep
	}
	g.ref = rep["participantRef"].(string)
	nb := rep["rtp"].(map[string]any)
	_ = ep.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(nb["port"].(float64)))
	if s, ok := nb["srtp"].(map[string]any); ok {
		if err := ep.SetSRTP(srtpKey, s["key"].(string)); err != nil {
			r.t.Fatal(err)
		}
	}
	go ep.Serve(rtpio.Handlers{Audio: g.m.hear})
	return g, rep
}

// play sends a tone (or silence with freq 0) for ms milliseconds at real-time pace.
func (g *appbridge) play(freq float64, ms int) {
	for i := 0; i < ms/audio.FrameMs; i++ {
		if freq == 0 {
			g.ep.Send(audio.Silence())
		} else {
			g.ep.Send(toneFrame(freq, i))
		}
		time.Sleep(audio.FrameMs * time.Millisecond)
	}
}

// answeredCallWith is answeredCall with a chosen offer; it returns the call, room and appbridge.
func (r *rig) answeredCallWith(o caller.DialOptions, srtpKey string) (*caller.Call, string, *appbridge) {
	to := fmt.Sprintf("+1%d", time.Now().UnixNano()%1e9)
	call, err := r.bot.DialWith(r.sipTarget(o.Transport), to, "", map[string]string{"X-App-Ref": "app-1"}, o)
	if err != nil {
		r.t.Fatal(err)
	}
	in := r.waitEvent(typed("call.incoming", "to", to), 3*time.Second)
	room := in["roomRef"].(string)
	g, rep := r.addSession(room, srtpKey)
	if rep["type"] != "ack" {
		r.t.Fatalf("participant.add: %v", rep)
	}
	r.command(map[string]any{"type": "answer", "id": "a-" + room, "roomRef": room})
	waitStatus(r.t, call, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	return call, room, g
}

func (r *rig) sipTarget(transport string) string {
	if transport == "tls" && r.tlsAddr != "" {
		return r.tlsAddr
	}
	return r.sip
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

func TestEachCodecCarriesAudioBothWays(t *testing.T) {
	r := start(t)
	for _, codec := range audio.PhoneCodecs() {
		t.Run(codec, func(t *testing.T) {
			call, room, g := r.answeredCallWith(caller.DialOptions{Codecs: []string{codec}}, "")
			if s := call.Status(); s.Codec != codec {
				t.Fatalf("answered with %q, offered only %s", s.Codec, codec)
			}
			// The caller's 1 kHz tone reaches the session participant.
			call.Speak("tone:1000", 600)
			time.Sleep(900 * time.Millisecond)
			if got := g.m.get(1000); got < 15 {
				t.Fatalf("session participant heard %d frames of the caller's 1 kHz tone", got)
			}
			// The session participant's audio reaches the caller.
			before := call.Status().AudibleMs
			g.play(600, 500)
			time.Sleep(200 * time.Millisecond)
			if got := call.Status().AudibleMs - before; got < 300 {
				t.Fatalf("caller heard %d ms of the session participant", got)
			}
			_ = call.Hangup()
			r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
		})
	}
}

func TestNoCommonCodecGets488(t *testing.T) {
	r := start(t)
	call, err := r.bot.DialWith(r.sip, "+1", "", nil, caller.DialOptions{Codecs: []string{"GSM/8000"}})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 488) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
}

func TestDTMFThreeWays(t *testing.T) {
	r := start(t)
	dtmfFrom := func(room, digit, source string) func(map[string]any) bool {
		return typed("dtmf", "roomRef", room, "digit", digit, "source", source)
	}
	anyDTMF := func(room string) func(map[string]any) bool { return typed("dtmf", "roomRef", room) }

	t.Run("sip_info", func(t *testing.T) {
		call, room, _ := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, "")
		call.DTMFVia("7", "info")
		r.waitEvent(dtmfFrom(room, "7", "sip_info"), 2*time.Second)
		time.Sleep(300 * time.Millisecond)
		if n := r.count(anyDTMF(room)); n != 1 {
			t.Fatalf("%d dtmf events for one INFO", n)
		}
		_ = call.Hangup()
	})
	t.Run("inband", func(t *testing.T) {
		call, room, _ := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, "")
		call.DTMFVia("#", "inband")
		r.waitEvent(dtmfFrom(room, "#", "inband"), 2*time.Second)
		time.Sleep(300 * time.Millisecond)
		if n := r.count(anyDTMF(room)); n != 1 {
			t.Fatalf("%d dtmf events for one tone", n)
		}
		_ = call.Hangup()
	})
	t.Run("inband_through_g722", func(t *testing.T) {
		call, room, _ := r.answeredCallWith(caller.DialOptions{Codecs: []string{audio.NameG722}, NoTelephoneEvent: true}, "")
		call.DTMFVia("3", "inband")
		r.waitEvent(dtmfFrom(room, "3", "inband"), 2*time.Second)
		_ = call.Hangup()
	})
	t.Run("no_double_report_rfc4733", func(t *testing.T) {
		call, room, _ := r.answeredCallWith(caller.DialOptions{}, "")
		// The tone is audible while the RFC 4733 events go out: in-band detection is off.
		go call.DTMFVia("1", "inband")
		call.DTMFVia("1", "rfc4733")
		time.Sleep(500 * time.Millisecond)
		if n := r.count(anyDTMF(room)); n != 1 {
			t.Fatalf("%d dtmf events, want exactly 1", n)
		}
		r.waitEvent(dtmfFrom(room, "1", "rfc4733"), time.Second)
		_ = call.Hangup()
	})
	t.Run("no_double_report_info", func(t *testing.T) {
		call, room, _ := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, "")
		call.DTMFVia("9", "info")
		r.waitEvent(dtmfFrom(room, "9", "sip_info"), 2*time.Second)
		// After INFO the leg uses INFO, so an audible tone is not reported again.
		call.DTMFVia("9", "inband")
		time.Sleep(500 * time.Millisecond)
		if n := r.count(anyDTMF(room)); n != 1 {
			t.Fatalf("%d dtmf events, want exactly 1", n)
		}
		_ = call.Hangup()
	})
}

// TestMixMinusThreeParticipants is the mix-minus checker (roomr "Mix-minus with three
// participants"): A and B send different tones, C is silent.
func TestMixMinusThreeParticipants(t *testing.T) {
	r := start(t)
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	a, _ := r.addSession(room, "")
	b, _ := r.addSession(room, "")
	c, _ := r.addSession(room, "")
	var wg sync.WaitGroup
	wg.Add(3)
	go func() { defer wg.Done(); a.play(600, 1000) }()
	go func() { defer wg.Done(); b.play(1000, 1000) }()
	go func() { defer wg.Done(); c.play(0, 1000) }()
	wg.Wait()
	time.Sleep(150 * time.Millisecond)
	if c.m.get(600) < 30 || c.m.get(1000) < 30 {
		t.Fatalf("C heard 600 Hz in %d frames and 1 kHz in %d", c.m.get(600), c.m.get(1000))
	}
	if a.m.get(1000) < 30 || a.m.get(600) > 0 {
		t.Fatalf("A heard B (1 kHz) in %d frames and itself (600 Hz) in %d", a.m.get(1000), a.m.get(600))
	}
	if b.m.get(600) < 30 || b.m.get(1000) > 0 {
		t.Fatalf("B heard A (600 Hz) in %d frames and itself (1 kHz) in %d", b.m.get(600), b.m.get(1000))
	}
	// Alone in a room, a participant hears silence.
	room2 := r.command(map[string]any{"type": "room.create", "id": "c2"})["roomRef"].(string)
	solo, _ := r.addSession(room2, "")
	solo.play(600, 400)
	time.Sleep(100 * time.Millisecond)
	if n := solo.m.get(0); n > 0 {
		t.Fatalf("a lone participant heard %d audible frames", n)
	}
}

func roomParticipants(n *node.Node, room string) int { return n.Participants(room) }

func TestRoomFullAndTrackKind(t *testing.T) {
	r := start(t)
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	// A video track is refused and leaves the room unchanged.
	rep := r.command(map[string]any{"type": "participant.add", "id": "v1", "roomRef": room, "kind": "session",
		"tracks": []any{map[string]any{"kind": "video", "codec": "VP8"}},
		"rtp":    map[string]any{"host": "127.0.0.1", "port": 9, "codec": "L16/16000"}})
	if rep["code"] != "unsupported_track_kind" || rep["id"] != "v1" {
		t.Fatalf("video track: %v", rep)
	}
	if n := roomParticipants(r.node, room); n != 0 {
		t.Fatalf("room has %d participants after a refused video track", n)
	}
	for i := 0; i < 10; i++ {
		if _, rep := r.addSession(room, ""); rep["type"] != "ack" {
			t.Fatalf("participant %d: %v", i+1, rep)
		}
	}
	_, rep = r.addSession(room, "")
	if rep["code"] != "room_full" {
		t.Fatalf("11th participant: %v", rep)
	}
	if n := roomParticipants(r.node, room); n != 10 {
		t.Fatalf("room has %d participants after room_full", n)
	}
}

func TestMaximumDuration(t *testing.T) {
	r := start(t)
	to := "+1999"
	call, _ := r.bot.Dial(r.sip, to, "", map[string]string{"X-App-Ref": "a"})
	in := r.waitEvent(typed("call.incoming", "to", to), 2*time.Second)
	room := in["roomRef"].(string)
	// The app's limit (1 s) is lower than the node's (4 h).
	r.command(map[string]any{"type": "answer", "id": "a1", "roomRef": room, "maxDurationSec": 1})
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 2*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "max_duration"), 4*time.Second)
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// A drain refuses nothing: Down stops the heartbeats and publishes node.down, new INVITEs and
// rooms are still accepted, live rooms keep carrying audio, and WaitRooms returns when the last
// one ends.
func TestDrain(t *testing.T) {
	r := start(t)
	beats := replica(t, node.HeartbeatSubject(r.node.ID()))
	calls := []*caller.Call{}
	gws := []*appbridge{}
	for i := 0; i < 3; i++ {
		c, _, g := r.answeredCallWith(caller.DialOptions{}, "")
		calls, gws = append(calls, c), append(gws, g)
	}
	done := make(chan int, 1)
	r.node.Down()
	go func() { done <- r.node.WaitRooms(10*time.Second, nil) }()
	// node.down arrives, and no heartbeat follows it.
	deadline := time.After(2 * time.Second)
	for down := false; !down; {
		select {
		case ev := <-beats:
			down = ev["type"] == "node.down"
		case <-deadline:
			t.Fatal("no node.down")
		}
	}
	select {
	case ev := <-beats:
		t.Fatalf("a heartbeat after node.down: %v", ev)
	case <-time.After(700 * time.Millisecond):
	}

	// Nothing is refused: a new INVITE is taken into a room.
	late, _ := r.bot.Dial(r.sip, "+1777", "", map[string]string{"X-App-Ref": "a"})
	r.waitEvent(typed("call.incoming", "to", "+1777"), 2*time.Second)
	_ = late.Hangup()
	// The three rooms keep carrying audio.
	for i, c := range calls {
		c.Speak("tone:1000", 300)
		time.Sleep(450 * time.Millisecond)
		if gws[i].m.get(1000) < 5 {
			t.Fatalf("room %d stopped carrying audio while draining", i)
		}
	}
	select {
	case <-done:
		t.Fatal("drain finished with rooms still up")
	default:
	}
	for _, c := range calls {
		_ = c.Hangup()
	}
	select {
	case forced := <-done:
		if forced != 0 {
			t.Fatalf("drain ended %d rooms itself", forced)
		}
	case <-time.After(3 * time.Second):
		t.Fatal("drain did not finish after the last room ended")
	}
}

func TestDrainMaximumWait(t *testing.T) {
	r := start(t)
	call, room, _ := r.answeredCallWith(caller.DialOptions{}, "")
	r.node.Down()
	if forced := r.node.WaitRooms(300*time.Millisecond, nil); forced != 1 {
		t.Fatalf("drain ended %d rooms, want 1", forced)
	}
	// node_error is what AppBridge maps to session.end reason "error".
	r.waitEvent(typed("room.ended", "roomRef", room, "reason", "node_error"), 2*time.Second)
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// ---- optional SIP over TLS and SDES-SRTP ----------------------------------------------------------------------

func selfSigned(t *testing.T) tls.Certificate {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	tmpl := &x509.Certificate{SerialNumber: big.NewInt(1), Subject: pkix.Name{CommonName: "roomr-test"},
		NotBefore: time.Now().Add(-time.Hour), NotAfter: time.Now().Add(time.Hour),
		IPAddresses: []net.IP{net.ParseIP("127.0.0.1")}, KeyUsage: x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth, x509.ExtKeyUsageClientAuth}}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, tmpl, &key.PublicKey, key)
	if err != nil {
		t.Fatal(err)
	}
	return tls.Certificate{Certificate: [][]byte{der}, PrivateKey: key}
}

func startEncrypted(t *testing.T) *rig {
	cert := selfSigned(t)
	server := &tls.Config{Certificates: []tls.Certificate{cert}}
	client := &tls.Config{InsecureSkipVerify: true} // test certificate
	tlsPort := freePort(t)
	r := startWith(t, rigOptions{
		uaCfg: func(c *sipua.Config) {
			c.TLSListen, c.TLSConfig, c.ClientTLS = "127.0.0.1:"+strconv.Itoa(tlsPort), server, client
		},
		botOpts: caller.Options{TLS: server, ClientTLS: client},
	})
	r.tlsAddr = "127.0.0.1:" + strconv.Itoa(tlsPort)
	return r
}

func TestEncryptedCall(t *testing.T) {
	r := startEncrypted(t)
	gwKey := rtpio.NewSRTPKey()
	call, room, g := r.answeredCallWith(caller.DialOptions{Transport: "tls", SRTP: true, Codecs: []string{audio.NamePCMA}}, gwKey)
	if s := call.Status(); !s.Secure {
		t.Fatalf("call answered without SRTP: %+v", s)
	}
	call.Speak("tone:1000", 500)
	time.Sleep(800 * time.Millisecond)
	if got := g.m.get(1000); got < 10 {
		t.Fatalf("appbridge heard %d frames of the caller over SRTP", got)
	}
	before := call.Status().AudibleMs
	g.play(600, 400)
	time.Sleep(200 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got < 200 {
		t.Fatalf("caller heard %d ms over SRTP", got)
	}
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
}

func TestAppBridgeLegSRTP(t *testing.T) {
	r := startEncrypted(t)
	room := r.command(map[string]any{"type": "room.create", "id": "c1"})["roomRef"].(string)
	a, rep := r.addSession(room, rtpio.NewSRTPKey())
	srtpBlock, _ := rep["rtp"].(map[string]any)["srtp"].(map[string]any)
	if srtpBlock["suite"] != rtpio.SRTPSuite || srtpBlock["key"] == "" {
		t.Fatalf("node's rtp block has no srtp keying: %v", rep)
	}
	b, _ := r.addSession(room, rtpio.NewSRTPKey())
	a.play(600, 400)
	time.Sleep(100 * time.Millisecond)
	if got := b.m.get(600); got < 10 {
		t.Fatalf("SRTP participant heard %d frames", got)
	}
	// Plain RTP sent to the node's SRTP port is dropped.
	plain, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer plain.Close()
	_ = plain.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(rep["rtp"].(map[string]any)["port"].(float64)))
	b.m.reset()
	for i := 0; i < 20; i++ {
		plain.Send(toneFrame(1000, i))
		time.Sleep(20 * time.Millisecond)
	}
	time.Sleep(100 * time.Millisecond)
	if got := b.m.get(0); got > 0 {
		t.Fatalf("plain RTP reached the room: %d audible frames", got)
	}
}

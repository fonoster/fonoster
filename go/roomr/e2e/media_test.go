package e2e

// Media tests: codecs, DTMF three ways, mix-minus, limits, encryption, drain and maximum duration.

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"math/big"
	"net"
	"strconv"
	"sync"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"google.golang.org/grpc/codes"
)

func TestROM009_EachCodecCarriesAudioBothWays(t *testing.T) {
	r := start(t)
	for _, codec := range audio.PhoneCodecs() {
		t.Run(codec, func(t *testing.T) {
			call, ac := r.answeredCallWith(caller.DialOptions{Codecs: []string{codec}}, false)
			if s := call.Status(); s.Codec != codec {
				t.Fatalf("answered with %q, offered only %s", s.Codec, codec)
			}
			call.Speak("tone:1000", 600)
			time.Sleep(900 * time.Millisecond)
			if got := ac.m.get(1000); got < 15 {
				t.Fatalf("the app heard %d frames of the caller's 1 kHz tone", got)
			}
			before := call.Status().AudibleMs
			ac.play(600, 500)
			time.Sleep(200 * time.Millisecond)
			if got := call.Status().AudibleMs - before; got < 300 {
				t.Fatalf("caller heard %d ms of the app", got)
			}
			_ = call.Hangup()
			r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef()), 3*time.Second)
		})
	}
}

func TestROM009_NoCommonCodecGets488(t *testing.T) {
	r := start(t)
	call, err := r.bot.DialWith(r.sip, "+1", "", nil, caller.DialOptions{Codecs: []string{"GSM/8000"}})
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 488) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	if n := r.app.count(); n != 0 {
		t.Fatalf("%d streams for a refused offer", n)
	}
}

func TestROM010_DTMFThreeWays(t *testing.T) {
	r := start(t)
	anyDTMF := dtmfMsg("", "")
	t.Run("sip_info", func(t *testing.T) {
		call, ac := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, false)
		call.DTMFVia("7", "info")
		ac.waitMsg(t, dtmfMsg("7", "sip_info"), 2*time.Second)
		time.Sleep(300 * time.Millisecond)
		if n := ac.countMsgs(anyDTMF); n != 1 {
			t.Fatalf("%d dtmf messages for one INFO", n)
		}
		_ = call.Hangup()
	})
	t.Run("inband", func(t *testing.T) {
		call, ac := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, false)
		call.DTMFVia("#", "inband")
		ac.waitMsg(t, dtmfMsg("#", "inband"), 2*time.Second)
		time.Sleep(300 * time.Millisecond)
		if n := ac.countMsgs(anyDTMF); n != 1 {
			t.Fatalf("%d dtmf messages for one tone", n)
		}
		_ = call.Hangup()
	})
	t.Run("inband_through_g722", func(t *testing.T) {
		call, ac := r.answeredCallWith(caller.DialOptions{Codecs: []string{audio.NameG722}, NoTelephoneEvent: true}, false)
		call.DTMFVia("3", "inband")
		ac.waitMsg(t, dtmfMsg("3", "inband"), 2*time.Second)
		_ = call.Hangup()
	})
	t.Run("no_double_report_rfc4733", func(t *testing.T) {
		call, ac := r.answeredCallWith(caller.DialOptions{}, false)
		go call.DTMFVia("1", "inband")
		call.DTMFVia("1", "rfc4733")
		time.Sleep(500 * time.Millisecond)
		if n := ac.countMsgs(anyDTMF); n != 1 {
			t.Fatalf("%d dtmf messages, want exactly 1", n)
		}
		ac.waitMsg(t, dtmfMsg("1", "rfc4733"), time.Second)
		_ = call.Hangup()
	})
	t.Run("no_double_report_info", func(t *testing.T) {
		call, ac := r.answeredCallWith(caller.DialOptions{NoTelephoneEvent: true}, false)
		call.DTMFVia("9", "info")
		ac.waitMsg(t, dtmfMsg("9", "sip_info"), 2*time.Second)
		call.DTMFVia("9", "inband")
		time.Sleep(500 * time.Millisecond)
		if n := ac.countMsgs(anyDTMF); n != 1 {
			t.Fatalf("%d dtmf messages, want exactly 1", n)
		}
		_ = call.Hangup()
	})
}

func (r *rig) createRoom() string {
	r.t.Helper()
	room, err := r.mc.CreateRoom(rpcCtx(r.t), &roomrv1.CreateRoomRequest{})
	if err != nil {
		r.t.Fatal(err)
	}
	return room.RoomRef
}

func (r *rig) mustJoin(room, key string) *rtpParty {
	r.t.Helper()
	g, _, err := r.join(room, key)
	if err != nil {
		r.t.Fatal(err)
	}
	return g
}

// TestROM017_MixMinusThreeParticipants is the mix-minus checker: A and B send different tones, C is silent.
func TestROM017_MixMinusThreeParticipants(t *testing.T) {
	r := start(t)
	room := r.createRoom()
	a, b, c := r.mustJoin(room, ""), r.mustJoin(room, ""), r.mustJoin(room, "")
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
	solo := r.mustJoin(r.createRoom(), "")
	solo.play(600, 400)
	time.Sleep(100 * time.Millisecond)
	if n := solo.m.get(0); n > 0 {
		t.Fatalf("a lone participant heard %d audible frames", n)
	}
}

func TestROM018_RoomFullAndTrackKind(t *testing.T) {
	r := start(t)
	room := r.createRoom()
	for i := 0; i < 10; i++ {
		if _, _, err := r.join(room, ""); err != nil {
			t.Fatalf("participant %d: %v", i+1, err)
		}
	}
	_, _, err := r.join(room, "")
	wantStatus(t, err, codes.ResourceExhausted, node.CodeRoomFull)
	if n := r.node.Participants(room); n != 10 {
		t.Fatalf("room has %d participants after room_full", n)
	}
}

func TestROM019_MaximumDuration(t *testing.T) {
	r := start(t)
	r.app.mu.Lock()
	r.app.maxDurationS = 1 // the app's limit is lower than the node's (4 h)
	r.app.mu.Unlock()
	call, ac := r.answeredCall()
	if e := ac.ended(t, 4*time.Second); e.GetCause() != "max_duration" {
		t.Fatalf("Ended = %v", e)
	}
	r.waitEvent(typed("call.ended", "call_ref", ac.start.GetCallRef(), "cause", "max_duration"), 2*time.Second)
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// A drain refuses nothing: Down stops the heartbeats and publishes node.down, new INVITEs are
// still accepted, live rooms keep carrying audio, and WaitRooms returns when the last one ends.
func TestROM032_Drain(t *testing.T) {
	r := start(t)
	beats := replica(t, node.HeartbeatSubject(r.node.ID()))
	calls := []*caller.Call{}
	apps := []*appCall{}
	for i := 0; i < 3; i++ {
		c, ac := r.answeredCall()
		calls, apps = append(calls, c), append(apps, ac)
	}
	done := make(chan int, 1)
	r.node.Down()
	go func() { done <- r.node.WaitRooms(10*time.Second, nil) }()
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
	late, _ := r.bot.Dial(r.sip, "+1777", "", nil)
	r.app.callTo("1777")
	waitStatus(t, late, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	_ = late.Hangup()
	for i, c := range calls {
		c.Speak("tone:1000", 300)
		time.Sleep(450 * time.Millisecond)
		if apps[i].m.get(1000) < 5 {
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

func TestROM032_DrainMaximumWait(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	r.node.Down()
	if forced := r.node.WaitRooms(300*time.Millisecond, nil); forced != 1 {
		t.Fatalf("drain ended %d rooms, want 1", forced)
	}
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef(), "cause", "node_error"), 2*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "node_error" {
		t.Fatalf("Ended = %v", e)
	}
	ac.waitClosed(t, 3*time.Second)
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// ---- optional SIP over TLS and SDES-SRTP ----------------------------------------------------------

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

func TestROM007_EncryptedCall(t *testing.T) {
	r := startEncrypted(t)
	call, ac := r.answeredCallWith(caller.DialOptions{Transport: "tls", SRTP: true, Codecs: []string{audio.NamePCMA}}, true)
	if s := call.Status(); !s.Secure {
		t.Fatalf("call answered without SRTP: %+v", s)
	}
	call.Speak("tone:1000", 500)
	time.Sleep(800 * time.Millisecond)
	if got := ac.m.get(1000); got < 10 {
		t.Fatalf("the app heard %d frames of the caller over SRTP", got)
	}
	before := call.Status().AudibleMs
	ac.play(600, 400)
	time.Sleep(200 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got < 200 {
		t.Fatalf("caller heard %d ms over SRTP", got)
	}
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef()), 3*time.Second)
}

// TestROM008_AppBridgeLegSRTP: Start carries the node's SRTP key; an app that answers with its own key
// gets SRTP both ways, and plain RTP sent to the node's app port is dropped. A plain call stays
// plain.
func TestROM008_AppBridgeLegSRTP(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCallWith(caller.DialOptions{}, true)
	if !rtpio.ValidSRTPKey(ac.start.GetMedia().GetSrtpKey()) {
		t.Fatalf("Start.media has no SRTP key: %v", ac.start.GetMedia())
	}
	call.Speak("tone:1000", 400)
	time.Sleep(700 * time.Millisecond)
	if got := ac.m.get(1000); got < 10 {
		t.Fatalf("the SRTP app leg heard %d frames", got)
	}
	plain, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer plain.Close()
	_ = plain.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(ac.start.GetMedia().GetPort()))
	ac.mute()
	before := call.Status().AudibleMs
	for i := 0; i < 20; i++ {
		plain.Send(toneFrame(1000, i))
		time.Sleep(20 * time.Millisecond)
	}
	time.Sleep(100 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got > 0 {
		t.Fatalf("plain RTP reached the room: %d ms", got)
	}
	_ = call.Hangup()
	// Plain by default: an app that answers without a key gets plain RTP.
	call2, ac2 := r.answeredCallWith(caller.DialOptions{}, false)
	before = call2.Status().AudibleMs
	ac2.play(600, 400)
	time.Sleep(200 * time.Millisecond)
	if got := call2.Status().AudibleMs - before; got < 200 {
		t.Fatalf("caller heard %d ms over plain RTP", got)
	}
	_ = call2.Hangup()
}

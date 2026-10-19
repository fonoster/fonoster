// End-to-end tests of Roomr over gRPC (redesign-roomr): the node serves both NATS
// commands and the gRPC service; the test is the controller, the callee bot the dialed party.
package e2e

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/binary"
	"fmt"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/control"
	"github.com/fonoster/fonoster/go/roomr/internal/edgetls"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipua"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
)

// withControl serves Roomr for the rig's node on a loopback port and returns a client.
func (r *rig) withControl(tlsConfig *tls.Config) (*control.Server, roomrv1.RoomrClient) {
	s, err := control.Listen("127.0.0.1:0", r.node, tlsConfig, nil)
	if err != nil {
		r.t.Fatal(err)
	}
	go func() { _ = s.Serve() }()
	r.t.Cleanup(s.Stop)
	conn, err := grpc.NewClient(s.Addr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		r.t.Fatal(err)
	}
	r.t.Cleanup(func() { _ = conn.Close() })
	return s, roomrv1.NewRoomrClient(conn)
}

func rpcCtx(t *testing.T) context.Context {
	c, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	t.Cleanup(cancel)
	return c
}

func wantStatus(t *testing.T, err error, code codes.Code, reason string) {
	t.Helper()
	st, _ := status.FromError(err)
	if st.Code() != code {
		t.Fatalf("got %v, want %v", err, code)
	}
	for _, d := range st.Details() {
		if info, ok := d.(*errdetails.ErrorInfo); ok && info.Reason == reason {
			return
		}
	}
	t.Fatalf("%v has no reason %q", err, reason)
}

// toneWav is a 16 kHz mono PCM16 WAV of a tone.
func toneWav(freq float64, ms int) []byte {
	samples := audio.Rate * ms / 1000
	var pcm bytes.Buffer
	for i := 0; i < samples; i++ {
		_ = binary.Write(&pcm, binary.LittleEndian, int16(8000*math.Sin(2*math.Pi*freq*float64(i)/audio.Rate)))
	}
	var b bytes.Buffer
	b.WriteString("RIFF")
	_ = binary.Write(&b, binary.LittleEndian, uint32(36+pcm.Len()))
	b.WriteString("WAVEfmt ")
	for _, v := range []any{uint32(16), uint16(1), uint16(1), uint32(audio.Rate), uint32(audio.Rate * 2), uint16(2), uint16(16)} {
		_ = binary.Write(&b, binary.LittleEndian, v)
	}
	b.WriteString("data")
	_ = binary.Write(&b, binary.LittleEndian, uint32(pcm.Len()))
	b.Write(pcm.Bytes())
	return b.Bytes()
}

func promptServer(t *testing.T, wav []byte) string {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "audio/wav")
		_, _ = w.Write(wav)
	}))
	t.Cleanup(srv.Close)
	return srv.URL + "/prompt.wav"
}

// calleeCall waits for the callee bot's one answered call.
func (r *rig) calleeCall() *caller.Call {
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		if calls := r.callee.Calls(); len(calls) == 1 && calls[0].State == "answered" {
			return r.callee.Get(calls[0].ID)
		}
		time.Sleep(10 * time.Millisecond)
	}
	r.t.Fatalf("callee calls: %+v", r.callee.Calls())
	return nil
}

func metadataOf(ev map[string]any) map[string]any {
	l, _ := ev["metadata"].(map[string]any)
	return l
}

// TestRoomrCreateCall: a room, then CreateCall into it through a proxy with extra headers;
// the call connects with the headers on the INVITE, a prompt plays, DTMF goes out, an RTP
// participant joins and leaves, and EndCall hangs up.
func TestRoomrCreateCall(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	ctx := rpcCtx(t)
	roomRef := fmt.Sprintf("lobby-%d", time.Now().UnixNano())
	room, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{RoomRef: roomRef})
	if err != nil || room.RoomRef != roomRef {
		t.Fatalf("CreateRoom: %v %v", room, err)
	}
	_, err = mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{RoomRef: roomRef})
	wantStatus(t, err, codes.AlreadyExists, node.CodeRoomExists)

	callRef := fmt.Sprintf("c-%d", time.Now().UnixNano())
	req := &roomrv1.CreateCallRequest{CallRef: callRef, From: "+15550001", RoomRef: roomRef,
		To: &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid", Proxy: "sip:" + r.callee.Address(),
			Headers: map[string]string{"X-Tenant": "t1", "X-Correlation-Id": "abc-123"}},
		Metadata: map[string]string{"tenant": "t1"}, RingTimeoutS: 10}
	call, err := mc.CreateCall(ctx, req)
	if err != nil {
		t.Fatal(err)
	}
	if call.CallRef != callRef || call.RoomRef != roomRef || call.State != roomrv1.Call_RINGING {
		t.Fatalf("CreateCall = %v", call)
	}
	answered := r.waitEvent(typed("call.answered", "callRef", callRef, "roomRef", roomRef), 5*time.Second)
	if metadataOf(answered)["tenant"] != "t1" {
		t.Fatalf("metadata not echoed: %v", answered)
	}
	callee := r.calleeCall()
	st := callee.Status()
	// Sent to the proxy (the bot) with the Request-URI untouched, the headers byte for byte.
	if !strings.Contains(st.RequestURI, "carrier.invalid") || !strings.Contains(st.RequestURI, "+15551234567") {
		t.Fatalf("Request-URI = %q", st.RequestURI)
	}
	if st.Headers["X-Tenant"] != "t1" || st.Headers["X-Correlation-Id"] != "abc-123" {
		t.Fatalf("headers = %v", st.Headers)
	}
	if !strings.Contains(st.From, "+15550001") {
		t.Fatalf("From = %q", st.From)
	}
	if _, has := st.Headers[sipua.DODNumberHeader]; has {
		t.Fatalf("CreateCall added %s: %v", sipua.DODNumberHeader, st.Headers)
	}

	// A repeated CreateCall returns the same call and sends no second INVITE.
	again, err := mc.CreateCall(ctx, req)
	if err != nil || again.State != roomrv1.Call_ANSWERED || again.RoomRef != roomRef || again.ParticipantRef == "" {
		t.Fatalf("repeat CreateCall = %v %v", again, err)
	}
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d calls", n)
	}

	// Play a 1 s prompt to the call: the callee hears it and operation.done follows.
	before := callee.Status().AudibleMs
	op, err := mc.Play(ctx, &roomrv1.PlayRequest{Target: &roomrv1.PlayRequest_CallRef{CallRef: callRef},
		Url: promptServer(t, toneWav(440, 1000))})
	if err != nil || op.OperationRef == "" {
		t.Fatalf("Play: %v %v", op, err)
	}
	r.waitEvent(typed("operation.done", "operationRef", op.OperationRef, "status", "completed"), 4*time.Second)
	waitStatus(t, callee, func(s caller.Status) bool { return s.AudibleMs-before >= 700 }, 2*time.Second)

	// DTMF on the call's leg.
	if _, err := mc.SendDtmf(ctx, &roomrv1.SendDtmfRequest{Target: &roomrv1.SendDtmfRequest_CallRef{CallRef: callRef},
		Digits: "12#"}); err != nil {
		t.Fatal(err)
	}
	waitStatus(t, callee, func(s caller.Status) bool { return s.Digits == "12#" }, 3*time.Second)

	// An RTP participant joins: the callee hears it; then it leaves.
	ep, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer ep.Close()
	go ep.Serve(rtpio.Handlers{})
	p, err := mc.Join(ctx, &roomrv1.JoinRequest{RoomRef: roomRef, Endpoint: &roomrv1.JoinRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: uint32(ep.Port()), Codec: "L16/16000"}}})
	if err != nil {
		t.Fatal(err)
	}
	if p.Rtp.GetPort() == 0 || p.TrackId == 0 {
		t.Fatalf("Join = %v", p)
	}
	r.waitEvent(typed("participant.joined", "participantRef", p.ParticipantRef), 2*time.Second)
	_ = ep.Configure(audio.L16{}, 96, -1, "127.0.0.1", int(p.Rtp.GetPort()))
	before = callee.Status().AudibleMs
	g := &appbridge{ep: ep}
	g.play(1000, 600)
	waitStatus(t, callee, func(s caller.Status) bool { return s.AudibleMs-before >= 300 }, 2*time.Second)
	if _, err := mc.Leave(ctx, &roomrv1.LeaveRequest{RoomRef: roomRef, ParticipantRef: p.ParticipantRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "participantRef", p.ParticipantRef, "reason", "removed"), 2*time.Second)

	// EndCall hangs up; the room, whose only phone party it was, ends with it.
	if _, err := mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	waitStatus(t, callee, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	r.waitEvent(typed("participant.left", "participantRef", again.ParticipantRef, "reason", "removed"), 2*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", roomRef), 2*time.Second)
	if _, err := mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatalf("EndCall of an ended call: %v", err)
	}
	_, err = mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: "no-such-call"})
	wantStatus(t, err, codes.NotFound, node.CodeCallNotFound)
	_, err = mc.Join(ctx, &roomrv1.JoinRequest{RoomRef: roomRef, Endpoint: &roomrv1.JoinRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 4000}}})
	wantStatus(t, err, codes.NotFound, node.CodeRoomNotFound)
}

// TestRoomrBusyCreatesNoLastingRoom: a busy callee ends the call with cause busy and SIP
// status 486, and the room CreateCall made for it is gone.
func TestRoomrBusyCreatesNoLastingRoom(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	r.callee.Callee("busy", 0)
	callRef := fmt.Sprintf("busy-%d", time.Now().UnixNano())
	call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.progress", "callRef", callRef, "status", "busy", "sipStatus", 486, "cause", "busy"), 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", call.RoomRef, "reason", "busy"), 2*time.Second)
	// room.ended is published just before the node drops the room.
	deadline := time.Now().Add(time.Second)
	for roomParticipants(r.node, call.RoomRef) >= 0 {
		if time.Now().After(deadline) {
			t.Fatalf("room %s still up", call.RoomRef)
		}
		time.Sleep(10 * time.Millisecond)
	}
	again, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil || again.State != roomrv1.Call_ENDED {
		t.Fatalf("repeat after busy = %v %v", again, err)
	}
}

// TestRoomrEndCallWhileRinging: EndCall on a ringing call cancels the INVITE.
func TestRoomrEndCallWhileRinging(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	r.callee.Callee("no_answer", 0)
	callRef := fmt.Sprintf("ring-%d", time.Now().UnixNano())
	call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil {
		t.Fatal(err)
	}
	time.Sleep(300 * time.Millisecond) // ringing
	if _, err := mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.progress", "callRef", callRef, "cause", "removed"), 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", call.RoomRef, "reason", "removed"), 2*time.Second)
}

// TestRoomrEndsInboundCalls: EndCall finds an inbound call by its X-Call-Ref and refuses
// it before the app answered (480); the NATS path still offered it as call.incoming.
func TestRoomrEndsInboundCalls(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	callRef := fmt.Sprintf("in-%d", time.Now().UnixNano())
	c, err := r.bot.Dial(r.sip, "+15550002222", "+15550001111", map[string]string{"X-App-Ref": "app-1", "X-Call-Ref": callRef})
	if err != nil {
		t.Fatal(err)
	}
	in := r.waitEvent(typed("call.incoming", "callRef", callRef), 2*time.Second)
	if _, err := mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	waitStatus(t, c, func(s caller.Status) bool { return contains(s.SIP, 480) }, 3*time.Second)
	r.waitEvent(typed("room.ended", "roomRef", in["roomRef"], "reason", "removed"), 2*time.Second)
}

// TestRoomrRefusals: typed status codes for a full room and bad input.
func TestRoomrRefusals(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxParticipants = 1 }})
	_, mc := r.withControl(nil)
	ctx := rpcCtx(t)
	room, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	join := &roomrv1.JoinRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.JoinRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "L16/16000"}}}
	if _, err := mc.Join(ctx, join); err != nil {
		t.Fatal(err)
	}
	_, err = mc.Join(ctx, join)
	wantStatus(t, err, codes.ResourceExhausted, node.CodeRoomFull)
	_, err = mc.Join(ctx, &roomrv1.JoinRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.JoinRequest_Webrtc{
		Webrtc: &roomrv1.WebRtcOffer{Sdp: "v=0"}}})
	wantStatus(t, err, codes.Unimplemented, node.CodeNotSupported)
	_, err = mc.Join(ctx, &roomrv1.JoinRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.JoinRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "GSM/8000"}}})
	if st, _ := status.FromError(err); st.Code() != codes.InvalidArgument && st.Code() != codes.ResourceExhausted {
		t.Fatalf("unsupported codec: %v", err)
	}
	_, err = mc.CreateCall(ctx, &roomrv1.CreateCallRequest{To: &roomrv1.SipTarget{Uri: "sip:a@b",
		Headers: map[string]string{"Via": "SIP/2.0/UDP 10.0.0.1"}}})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	_, err = mc.SendDtmf(ctx, &roomrv1.SendDtmfRequest{Target: &roomrv1.SendDtmfRequest_CallRef{CallRef: "nope"}, Digits: "1"})
	wantStatus(t, err, codes.NotFound, node.CodeCallNotFound)

}

// TestRoomrMutualTLS: with a client CA the listener serves only controllers that present
// a certificate it signed; the PEMs come as file paths and secret:// references (edgetls).
func TestRoomrMutualTLS(t *testing.T) {
	r := start(t)
	p := newPKI(t, "fonoster-control-ca")
	nodeCert, nodeKey := p.leaf("node")
	t.Setenv("RB_TEST_CONTROL_KEY", string(mustRead(t, nodeKey)))
	server, err := edgetls.Build(edgetls.Options{Cert: "secret://file" + nodeCert, Key: "secret://env/RB_TEST_CONTROL_KEY",
		ClientCA: p.caPath()})
	if err != nil || !server.Mutual {
		t.Fatalf("tls: %v %+v", err, server)
	}
	s, _ := r.withControl(server.Server)
	dialTLS := func(certPath, keyPath string) roomrv1.RoomrClient {
		cfg := edgeTLS(t, p, certPath, keyPath)
		conn, err := grpc.NewClient(s.Addr(), grpc.WithTransportCredentials(credentials.NewTLS(cfg)))
		if err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() { _ = conn.Close() })
		return roomrv1.NewRoomrClient(conn)
	}
	ctrlCert, ctrlKey := p.leaf("controller")
	if _, err := dialTLS(ctrlCert, ctrlKey).CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{}); err != nil {
		t.Fatalf("controller with a certificate refused: %v", err)
	}
	if _, err := dialTLS("", "").CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{}); err == nil {
		t.Fatal("controller without a certificate served")
	}
	plain, err := grpc.NewClient(s.Addr(), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fatal(err)
	}
	defer plain.Close()
	if _, err := roomrv1.NewRoomrClient(plain).CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{}); err == nil {
		t.Fatal("plaintext controller served")
	}
}

// TestRoomrAtCapacity: the room limit covers rooms opened over gRPC (roomr "Node at
// its limit"): CreateRoom and CreateCall into a new room fail with RESOURCE_EXHAUSTED and no
// INVITE is sent, room.create over NATS sees the same limit, and a room that ends frees a place.
func TestRoomrAtCapacity(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 1 }})
	_, mc := r.withControl(nil)
	ctx := rpcCtx(t)
	room, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	if !r.node.AtCapacity() {
		t.Fatal("a room created over gRPC does not count toward the limit")
	}
	_, err = mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{})
	wantStatus(t, err, codes.ResourceExhausted, node.CodeAtCapacity)
	_, err = mc.CreateCall(ctx, &roomrv1.CreateCallRequest{To: &roomrv1.SipTarget{Uri: "sip:+1@carrier", Proxy: r.callee.Address()}})
	wantStatus(t, err, codes.ResourceExhausted, node.CodeAtCapacity)
	if n := len(r.callee.Calls()); n != 0 {
		t.Fatalf("a node at its limit sent %d INVITEs", n)
	}
	if reply := r.command(map[string]any{"type": "room.create", "id": "c1"}); reply["code"] != "at_capacity" {
		t.Fatalf("room.create at the limit: %v", reply)
	}
	if r.node.ActiveRooms() != 1 {
		t.Fatalf("rooms %d, want 1", r.node.ActiveRooms())
	}
	if _, err := mc.EndRoom(ctx, &roomrv1.EndRoomRequest{RoomRef: room.RoomRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "roomRef", room.RoomRef), 2*time.Second)
	if _, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{}); err != nil {
		t.Fatalf("CreateRoom after a room ended: %v", err)
	}
}

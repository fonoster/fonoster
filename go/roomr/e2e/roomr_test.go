// End-to-end tests of Roomr over gRPC (redesign-roomr): the test is the controller, the
// callee bot the dialed party, the fake app the session endpoint.
package e2e

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"math"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/edgetls"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/status"
)

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

// TestROM021_RoomrCreateCall: a room, then CreateCall into it through a proxy with extra headers;
// the call connects with the headers on the INVITE, the app gets Start (OUTBOUND, the room, the
// metadata) and sends Ready, an RTP participant is added and removed, and EndCall hangs up.
func TestROM021_RoomrCreateCall(t *testing.T) {
	r := start(t)
	mc := r.mc
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
	answered := r.waitEvent(typed("call.answered", "call_ref", callRef, "room_ref", roomRef), 5*time.Second)
	if metadataOf(answered)["tenant"] != "t1" {
		t.Fatalf("metadata not echoed: %v", answered)
	}
	ac := r.app.callRef(callRef)
	if s := ac.start; s.GetDirection() != sessionv1.Start_OUTBOUND || s.GetRoomRef() != roomRef ||
		s.GetMetadata()["tenant"] != "t1" || s.GetHeaders()["X-Tenant"] != "t1" || s.GetFrom() != "+15550001" {
		t.Fatalf("Start = %v", s)
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
	if _, has := st.Headers["X-DOD-Number"]; has {
		t.Fatalf("CreateCall added X-DOD-Number: %v", st.Headers)
	}

	// A repeated CreateCall returns the same call and sends no second INVITE.
	again, err := mc.CreateCall(ctx, req)
	if err != nil || again.State != roomrv1.Call_ANSWERED || again.RoomRef != roomRef || again.ParticipantRef == "" {
		t.Fatalf("repeat CreateCall = %v %v", again, err)
	}
	if n := len(r.callee.Calls()); n != 1 {
		t.Fatalf("callee saw %d calls", n)
	}

	// An RTP participant joins: the callee hears it; then it leaves.
	g, p, err := r.join(roomRef, "")
	if err != nil {
		t.Fatal(err)
	}
	if p.Rtp.GetPort() == 0 || p.TrackId == 0 {
		t.Fatalf("AddParticipant = %v", p)
	}
	r.waitEvent(typed("participant.joined", "participant_ref", p.ParticipantRef, "room_ref", roomRef), 2*time.Second)
	ac.waitMsg(t, joinedMsg(p.ParticipantRef), 2*time.Second)
	before := callee.Status().AudibleMs
	g.play(1000, 600)
	waitStatus(t, callee, func(s caller.Status) bool { return s.AudibleMs-before >= 300 }, 2*time.Second)
	if _, err := mc.RemoveParticipant(ctx, &roomrv1.RemoveParticipantRequest{RoomRef: roomRef, ParticipantRef: p.ParticipantRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "participant_ref", p.ParticipantRef, "cause", "removed"), 2*time.Second)

	// EndCall hangs up; the app gets Ended with cause removed and its stream closes. The room
	// came from CreateRoom, so it stays until EndRoom.
	if _, err := mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	waitStatus(t, callee, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	r.waitEvent(typed("participant.left", "participant_ref", again.ParticipantRef, "cause", "removed"), 2*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", callRef, "cause", "removed"), 2*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "removed" {
		t.Fatalf("Ended = %v", e)
	}
	ac.waitClosed(t, 3*time.Second)
	if _, err := mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatalf("EndCall of an ended call: %v", err)
	}
	_, err = mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: "no-such-call"})
	wantStatus(t, err, codes.NotFound, node.CodeCallNotFound)
	if _, err := mc.EndRoom(ctx, &roomrv1.EndRoomRequest{RoomRef: roomRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "room_ref", roomRef, "cause", "removed"), 2*time.Second)
	_, err = mc.AddParticipant(ctx, &roomrv1.AddParticipantRequest{RoomRef: roomRef, Endpoint: &roomrv1.AddParticipantRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 4000}}})
	wantStatus(t, err, codes.NotFound, node.CodeRoomNotFound)
}

// TestROM022_RoomrBusyCreatesNoLastingRoom: a busy callee ends the call with cause busy and SIP
// status 486; no room was created and no stream opened.
func TestROM022_RoomrBusyCreatesNoLastingRoom(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	callRef := fmt.Sprintf("busy-%d", time.Now().UnixNano())
	target := &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef, To: target})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", callRef, "sip_status", 486, "cause", "busy"), 3*time.Second)
	if r.node.Participants(call.RoomRef) >= 0 || r.find(typed("room.ended", "room_ref", call.RoomRef)) != nil {
		t.Fatalf("a room exists for a busy call")
	}
	if n := r.app.count(); n != 0 {
		t.Fatalf("%d control streams for a busy call", n)
	}
	again, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef, To: target})
	if err != nil || again.State != roomrv1.Call_ENDED {
		t.Fatalf("repeat after busy = %v %v", again, err)
	}
}

// TestROM023_RoomrEndCallWhileRinging: EndCall on a ringing call cancels the INVITE; the call ends
// with cause removed, with no room and no stream.
func TestROM023_RoomrEndCallWhileRinging(t *testing.T) {
	r := start(t)
	r.callee.Callee("no_answer", 0)
	callRef := fmt.Sprintf("ring-%d", time.Now().UnixNano())
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil {
		t.Fatal(err)
	}
	time.Sleep(300 * time.Millisecond) // ringing
	if _, err := r.mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", callRef, "cause", "removed"), 3*time.Second)
	if r.node.Participants(call.RoomRef) >= 0 || r.app.count() != 0 {
		t.Fatal("a room or a stream exists for a cancelled call")
	}
	deadline := time.Now().Add(3 * time.Second)
	for {
		calls := r.callee.Calls()
		if len(calls) == 0 || calls[0].State == "ended" {
			break
		}
		if time.Now().After(deadline) {
			t.Fatalf("callee still ringing: %+v", calls)
		}
		time.Sleep(20 * time.Millisecond)
	}
}

// TestROM023_RoomrEndsInboundCalls: EndCall finds an inbound call by its X-Call-Ref and refuses it
// before the app answered (480, cause removed); the app gets Ended.
func TestROM023_RoomrEndsInboundCalls(t *testing.T) {
	r := start(t)
	r.app.setMode(modeStall)
	callRef := fmt.Sprintf("in-%d", time.Now().UnixNano())
	c, err := r.bot.Dial(r.sip, "+15550002222", "+15550001111", map[string]string{"X-Call-Ref": callRef})
	if err != nil {
		t.Fatal(err)
	}
	ac := r.app.callRef(callRef)
	if _, err := r.mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	waitStatus(t, c, func(s caller.Status) bool { return contains(s.SIP, 480) }, 3*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", callRef, "cause", "removed"), 2*time.Second)
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef(), "cause", "removed"), 2*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "removed" {
		t.Fatalf("Ended = %v", e)
	}
}

// TestROM037_RoomrRefusals: typed status codes for a full room and bad input.
func TestROM037_RoomrRefusals(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxParticipants = 1 }})
	mc := r.mc
	ctx := rpcCtx(t)
	room, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	join := &roomrv1.AddParticipantRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.AddParticipantRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "L16/16000"}}}
	if _, err := mc.AddParticipant(ctx, join); err != nil {
		t.Fatal(err)
	}
	_, err = mc.AddParticipant(ctx, join)
	wantStatus(t, err, codes.ResourceExhausted, node.CodeRoomFull)
	_, err = mc.AddParticipant(ctx, &roomrv1.AddParticipantRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.AddParticipantRequest_Webrtc{
		Webrtc: &roomrv1.WebRtcOffer{Sdp: "v=0"}}})
	wantStatus(t, err, codes.Unimplemented, node.CodeNotSupported)
	_, err = mc.AddParticipant(ctx, &roomrv1.AddParticipantRequest{RoomRef: room.RoomRef, Endpoint: &roomrv1.AddParticipantRequest_Rtp{
		Rtp: &roomrv1.MediaEndpoint{Ip: "127.0.0.1", Port: 40000, Codec: "GSM/8000"}}})
	if st, _ := status.FromError(err); st.Code() != codes.InvalidArgument && st.Code() != codes.ResourceExhausted {
		t.Fatalf("unsupported codec: %v", err)
	}
	_, err = mc.CreateCall(ctx, &roomrv1.CreateCallRequest{To: &roomrv1.SipTarget{Uri: "sip:a@b",
		Headers: map[string]string{"Via": "SIP/2.0/UDP 10.0.0.1"}}})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	// A CR or LF in a header value is refused before any INVITE.
	_, err = mc.CreateCall(ctx, &roomrv1.CreateCallRequest{To: &roomrv1.SipTarget{Uri: "sip:a@b", Proxy: r.callee.Address(),
		Headers: map[string]string{"X-Evil": "one\r\nBYE sip:x SIP/2.0"}}})
	wantStatus(t, err, codes.InvalidArgument, node.CodeBadMessage)
	if n := len(r.callee.Calls()); n != 0 {
		t.Fatalf("a refused CreateCall sent %d INVITEs", n)
	}
}

// TestROM007_RoomrMutualTLS: with a client CA the control listener serves only controllers that
// present a certificate it signed; the PEMs come as file paths and secret:// references.
func TestROM007_RoomrMutualTLS(t *testing.T) {
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
	if _, err := roomrv1.NewRoomrClient(dialInsecure(t, s.Addr())).CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{}); err == nil {
		t.Fatal("plaintext controller served")
	}
}

// TestROM020_RoomrAtCapacity: the room limit covers every room (roomr "Node full"): CreateRoom
// and CreateCall into a new room fail with RESOURCE_EXHAUSTED and no INVITE is sent, an INVITE
// gets 503, and a room that ends frees a place.
func TestROM020_RoomrAtCapacity(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MaxRooms = 1 }})
	mc := r.mc
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
	// CreateCall into the existing room needs no new place.
	if _, err := mc.CreateCall(ctx, &roomrv1.CreateCallRequest{RoomRef: room.RoomRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1@carrier", Proxy: r.callee.Address()}}); err != nil {
		t.Fatalf("CreateCall into the existing room: %v", err)
	}
	if r.node.ActiveRooms() != 1 {
		t.Fatalf("rooms %d, want 1", r.node.ActiveRooms())
	}
	if _, err := mc.EndRoom(ctx, &roomrv1.EndRoomRequest{RoomRef: room.RoomRef}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("room.ended", "room_ref", room.RoomRef), 3*time.Second)
	if _, err := mc.CreateRoom(ctx, &roomrv1.CreateRoomRequest{}); err != nil {
		t.Fatalf("CreateRoom after a room ended: %v", err)
	}
}

// TestROM029_RoomEventsHaveTheirOwnSequence: an RTP participant joins and leaves a room with no call,
// then the room ends: seq 1, 2 and 3 on roomr.events.room.<room_ref>.
func TestROM029_RoomEventsHaveTheirOwnSequence(t *testing.T) {
	r := start(t)
	ref := fmt.Sprintf("lobby-%d", time.Now().UnixNano())
	events := replica(t, "roomr.events.room."+ref)
	if _, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{RoomRef: ref}); err != nil {
		t.Fatal(err)
	}
	_, p, err := r.join(ref, "")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := r.mc.RemoveParticipant(rpcCtx(t), &roomrv1.RemoveParticipantRequest{RoomRef: ref, ParticipantRef: p.ParticipantRef}); err != nil {
		t.Fatal(err)
	}
	if _, err := r.mc.EndRoom(rpcCtx(t), &roomrv1.EndRoomRequest{RoomRef: ref}); err != nil {
		t.Fatal(err)
	}
	for i, want := range []string{"participant.joined", "participant.left", "room.ended"} {
		select {
		case ev := <-events:
			if ev["type"] != want || ev["seq"] != float64(i+1) || ev["room_ref"] != ref || ev["node_ref"] != r.node.ID() {
				t.Fatalf("event %d = %v, want %s", i+1, ev, want)
			}
		case <-time.After(3 * time.Second):
			t.Fatalf("no %s", want)
		}
	}
}

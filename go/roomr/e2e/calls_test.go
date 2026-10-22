package e2e

// Calls through the control stream (redesign-roomr, roomr "Inbound calls become rooms" and
// media-control "Each call opens one control stream to the session endpoint"): the caller bot
// calls the node, the fake app answers on its stream and exchanges RTP as the app leg.

import (
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/nats-io/nats.go"
)

func TestROM001_InboundCallSlice(t *testing.T) {
	r := start(t)
	r.app.mu.Lock()
	r.app.delay = 500 * time.Millisecond // the app is slow to answer
	r.app.mu.Unlock()
	sent := time.Now()
	call, err := r.bot.Dial(r.sip, "+15550002222", "+15550001111", map[string]string{
		"X-App-Ref": "app-1", "X-Call-Ref": "call-9", "X-Call-Direction": "FROM_PSTN", "X-Anything": "42"})
	if err != nil {
		t.Fatal(err)
	}
	// 180 Ringing at once, 200 OK only after the app's Answer.
	waitStatus(t, call, func(s caller.Status) bool { return contains(s.SIP, 180) }, 200*time.Millisecond)
	if s := call.Status(); contains(s.SIP, 200) {
		t.Fatalf("200 OK before the Answer: %v (after %v)", s.SIP, time.Since(sent))
	}
	ac := r.app.callTo("+15550002222")
	s := ac.start
	if s.GetCallRef() != "call-9" || s.GetDirection() != sessionv1.Start_INBOUND || s.GetFrom() != "+15550001111" ||
		s.GetRoomRef() == "" || s.GetNodeRef() != r.node.ID() || s.GetMedia().GetPort() == 0 ||
		s.GetMedia().GetCodec() != audio.NameL16 {
		t.Fatalf("Start = %v", s)
	}
	// Every INVITE header reaches the app untouched; the node interprets none of them.
	for k, v := range map[string]string{"X-App-Ref": "app-1", "X-Anything": "42", "X-Call-Direction": "FROM_PSTN"} {
		if s.GetHeaders()[k] != v {
			t.Fatalf("Start.headers[%s] = %q, want %q (all: %v)", k, s.GetHeaders()[k], v, s.GetHeaders())
		}
	}
	if s.GetHeaders()["Call-ID"] == "" || !strings.Contains(s.GetHeaders()["To"], "+15550002222") {
		t.Fatalf("Start.headers lacks the core headers: %v", s.GetHeaders())
	}
	room := s.GetRoomRef()
	status := waitStatus(t, call, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	if !contains(status.SIP, 180) || !contains(status.SIP, 200) {
		t.Fatalf("caller statuses %v", status.SIP)
	}
	r.waitEvent(typed("call.answered", "call_ref", "call-9", "room_ref", room), 2*time.Second)

	// The caller's tone reaches the app (the app hears the caller).
	call.Speak("tone:1000", 400)
	time.Sleep(700 * time.Millisecond)
	if got := ac.m.get(1000); got < 10 {
		t.Fatalf("the app heard %d frames of the caller's tone", got)
	}
	// The app's audio reaches the caller.
	before := call.Status().AudibleMs
	ac.play(440, 500)
	time.Sleep(200 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got < 300 {
		t.Fatalf("caller heard %d ms of the app", got)
	}

	// RFC 4733 keypress, reported once on the stream.
	call.DTMF("5")
	ac.waitMsg(t, dtmfMsg("5", "rfc4733"), 2*time.Second)

	// Hold: the app hears silence, the caller hears silence (no music given); Resume restores.
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Hold{Hold: &sessionv1.Hold{}}})
	time.Sleep(100 * time.Millisecond)
	if !r.node.Held(room) {
		t.Fatal("caller not on hold")
	}
	ac.m.reset()
	call.Speak("tone:1000", 400)
	time.Sleep(600 * time.Millisecond)
	if n := ac.m.get(0); n > 0 {
		t.Fatalf("the app heard %d audible frames while the caller was on hold", n)
	}
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Resume{Resume: &sessionv1.Resume{}}})
	time.Sleep(100 * time.Millisecond)
	if r.node.Held(room) {
		t.Fatal("caller still on hold after Resume")
	}

	// The caller hangs up: causes on the events and on the stream, which then closes.
	if err := call.Hangup(); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "call_ref", "call-9", "cause", "caller_hangup"), 2*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", "call-9", "cause", "caller_hangup"), 2*time.Second)
	r.waitEvent(typed("room.ended", "room_ref", room, "cause", "caller_hangup"), 2*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "caller_hangup" {
		t.Fatalf("Ended = %v", e)
	}
	ac.waitClosed(t, 3*time.Second)
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("%d rooms still active", n)
	}
}

// TestROM002_SessionEndpointUnreachableGets503: the session endpoint refuses connections; the caller
// gets 503 and no room remains.
func TestROM002_SessionEndpointUnreachableGets503(t *testing.T) {
	dead := fmt.Sprintf("127.0.0.1:%d", freePort(t))
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.SessionEndpoint = dead }})
	call, err := r.bot.Dial(r.sip, "+15550002222", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 7*time.Second)
	if !contains(s.SIP, 503) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	r.waitEvent(typed("call.ended", "cause", "app_gone", "sip_status", 503), 2*time.Second)
	deadline := time.Now().Add(2 * time.Second)
	for r.node.ActiveRooms() != 0 && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if n := r.node.ActiveRooms(); n != 0 {
		t.Fatalf("%d rooms remain", n)
	}
}

// TestROM002_AppNeverAnswersGets480: the app keeps the stream open but sends neither Answer nor
// Reject; after the answer timeout the caller gets 480 and the stream closes.
func TestROM002_AppNeverAnswersGets480(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.AnswerTimeout = 700 * time.Millisecond }})
	r.app.setMode(modeStall)
	call, err := r.bot.Dial(r.sip, "+15550004444", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	ac := r.app.callTo("+15550004444")
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 480) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "app_gone" || e.GetSipStatus() != 480 {
		t.Fatalf("Ended = %v", e)
	}
	ac.waitClosed(t, 3*time.Second)
}

// TestROM003_CallerCancelsBeforeAnswer: CANCEL while the app has not answered: 487 to the caller,
// Ended caller_hangup to the app, the stream closes.
func TestROM003_CallerCancelsBeforeAnswer(t *testing.T) {
	r := start(t)
	r.app.setMode(modeStall)
	call, err := r.bot.Dial(r.sip, "+15550005555", "", nil)
	if err != nil {
		t.Fatal(err)
	}
	ac := r.app.callTo("+15550005555")
	waitStatus(t, call, func(s caller.Status) bool { return contains(s.SIP, 180) }, 2*time.Second)
	_ = call.Hangup() // CANCEL
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 487) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "caller_hangup" {
		t.Fatalf("Ended = %v", e)
	}
	ac.waitClosed(t, 3*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", ac.start.GetCallRef(), "cause", "caller_hangup"), 2*time.Second)
}

// TestROM004_StreamBreakHangsUp: the app instance holding a stream is killed mid-call: the node sends
// BYE to the caller, publishes call.ended app_gone and opens no new stream.
func TestROM004_StreamBreakHangsUp(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	ac.killStream()
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 5*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", ac.start.GetCallRef(), "cause", "app_gone"), 2*time.Second)
	time.Sleep(300 * time.Millisecond)
	if n := r.app.count(); n != 1 {
		t.Fatalf("%d streams for one call", n)
	}
}

func TestROM002_NodeHangupAndRejection(t *testing.T) {
	r := start(t)
	// The app rejects with 404.
	r.app.setMode(modeReject)
	call, _ := r.bot.Dial(r.sip, "+1", "", nil)
	ac := r.app.callTo("1")
	s := waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	if !contains(s.SIP, 404) {
		t.Fatalf("caller statuses %v", s.SIP)
	}
	r.waitEvent(typed("call.ended", "call_ref", ac.start.GetCallRef(), "cause", "rejected", "sip_status", 404), 2*time.Second)
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef(), "cause", "rejected", "sip_status", 404), 2*time.Second)

	// Answered, then the app hangs up: the caller gets BYE.
	r.app.setMode(modeAnswer)
	call2, ac2 := r.answeredCall()
	ac2.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Hangup{Hangup: &sessionv1.Hangup{}}})
	waitStatus(t, call2, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", ac2.start.GetCallRef(), "cause", "removed"), 2*time.Second)
	if e := ac2.ended(t, 2*time.Second); e.GetCause() != "removed" {
		t.Fatalf("Ended = %v", e)
	}
}

// TestROM012_HoldLoopsHoldMusic: Hold{music} loops the hold audio to the caller alone; Resume stops it.
func TestROM012_HoldLoopsHoldMusic(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	url := promptServer(t, toneWav(440, 400))
	before := call.Status().AudibleMs
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Hold{Hold: &sessionv1.Hold{Music: url}}})
	// 400 ms of tone, looped: well past one pass.
	waitStatus(t, call, func(s caller.Status) bool { return s.AudibleMs-before >= 700 }, 3*time.Second)
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Resume{Resume: &sessionv1.Resume{}}})
	time.Sleep(200 * time.Millisecond)
	before = call.Status().AudibleMs
	time.Sleep(500 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got > 100 {
		t.Fatalf("the caller still hears hold music after Resume (%d ms)", got)
	}
	_ = call.Hangup()
}

func TestROM031_Heartbeats(t *testing.T) {
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

// TestROM021_DialIntoRoom: CreateCall into a CreateRoom room; the dialed party hangs up: the call
// ends with callee_hangup and the room, which came from CreateRoom, stays (empty).
func TestROM021_DialIntoRoom(t *testing.T) {
	r := start(t)
	room, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{RoomRef: room.RoomRef,
		To: &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid"}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ringing", "call_ref", call.CallRef), 2*time.Second)
	r.waitEvent(typed("call.answered", "call_ref", call.CallRef), 3*time.Second)
	joined := r.waitEvent(typed("participant.joined", "call_ref", call.CallRef, "kind", "phone"), 2*time.Second)
	ac := r.app.callRef(call.CallRef)
	if err := r.calleeCall().Hangup(); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("participant.left", "participant_ref", joined["participant_ref"], "cause", "callee_hangup"), 2*time.Second)
	r.waitEvent(typed("call.ended", "call_ref", call.CallRef, "cause", "callee_hangup"), 2*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "callee_hangup" {
		t.Fatalf("Ended = %v", e)
	}
	time.Sleep(200 * time.Millisecond)
	if n := r.node.Participants(room.RoomRef); n != 0 {
		t.Fatalf("room %s has %d participants, want 0 (still up)", room.RoomRef, n)
	}
}

func TestROM022_DialBusy(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	room, err := r.mc.CreateRoom(rpcCtx(t), &roomrv1.CreateRoomRequest{})
	if err != nil {
		t.Fatal(err)
	}
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{RoomRef: room.RoomRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1@carrier.invalid"}})
	if err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", call.CallRef, "cause", "busy", "sip_status", 486), 3*time.Second)
}

// transferTo is a Transfer to the callee bot.
func (r *rig) transferTo(mode string) *sessionv1.AppMessage {
	return &sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Transfer{Transfer: &sessionv1.Transfer{
		To: &sessionv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid"}, Mode: mode}}}
}

func TestROM013_ColdTransfer(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	ac.send(r.transferTo("cold"))
	ac.waitMsg(t, transferMsg("completed"), 3*time.Second)
	ac.waitMsg(t, leftMsg("removed"), 2*time.Second) // the app's leg left
	callRef := ac.start.GetCallRef()
	r.waitEvent(typed("participant.joined", "call_ref", callRef, "kind", "phone"), 2*time.Second)
	r.waitEvent(typed("participant.left", "call_ref", callRef, "kind", "app", "cause", "removed"), 2*time.Second)

	// The caller and the new party hear each other through the room.
	callee := r.calleeCall()
	before := callee.Status().AudibleMs
	call.Speak("tone", 400)
	time.Sleep(700 * time.Millisecond)
	if got := callee.Status().AudibleMs - before; got < 200 {
		t.Fatalf("new party heard %d ms of the caller", got)
	}
	// The app may now close its stream: the call goes on.
	ac.killStream()
	time.Sleep(300 * time.Millisecond)
	if call.Status().State != "answered" {
		t.Fatal("the transferred call ended with the app's stream")
	}
	// The caller hangs up: the new party gets BYE and the room ends.
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef()), 2*time.Second)
	waitStatus(t, callee, func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

func TestROM014_WarmTransfer(t *testing.T) {
	r := start(t)
	_, ac := r.answeredCall()
	room := ac.start.GetRoomRef()
	ac.send(r.transferTo("warm"))
	deadline := time.Now().Add(time.Second)
	for !r.node.Held(room) && time.Now().Before(deadline) {
		time.Sleep(10 * time.Millisecond)
	}
	if !r.node.Held(room) {
		t.Fatal("caller not on hold during a warm transfer")
	}
	r.waitEvent(typed("participant.joined", "call_ref", ac.start.GetCallRef(), "kind", "phone"), 3*time.Second)
	// The app and the new party hear each other while the caller is held.
	callee := r.calleeCall()
	before := callee.Status().AudibleMs
	ac.play(600, 400)
	if got := callee.Status().AudibleMs - before; got < 200 {
		t.Fatalf("new party heard %d ms of the app", got)
	}
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_TransferComplete{TransferComplete: &sessionv1.TransferComplete{}}})
	ac.waitMsg(t, transferMsg("completed"), 2*time.Second)
	r.waitEvent(typed("participant.left", "kind", "app", "cause", "removed", "room_ref", room), 2*time.Second)
	if r.node.Held(room) {
		t.Fatal("caller still on hold after TransferComplete")
	}
}

func TestROM014_WarmTransferNotAnswered(t *testing.T) {
	r := start(t)
	node.WarmTransferTimeout = 500 * time.Millisecond
	defer func() { node.WarmTransferTimeout = 30 * time.Second }()
	r.callee.Callee("no_answer", 0)
	_, ac := r.answeredCall()
	ac.send(r.transferTo("warm"))
	m := ac.waitMsg(t, transferMsg("failed"), 3*time.Second)
	if c := m.GetEvent().GetTransferResult().GetCause(); c != "no_answer" {
		t.Fatalf("TransferResult cause %q", c)
	}
	if r.node.Held(ac.start.GetRoomRef()) {
		t.Fatal("caller still on hold after a failed warm transfer")
	}
}

func TestROM013_ReferTransfer(t *testing.T) {
	r := start(t)
	_, ac := r.answeredCall()
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_Transfer{Transfer: &sessionv1.Transfer{
		To: &sessionv1.SipTarget{Uri: "tel:+15551234567"}, Mode: "refer"}}})
	ac.waitMsg(t, transferMsg("referred"), 3*time.Second)
	r.waitEvent(typed("room.ended", "room_ref", ac.start.GetRoomRef()), 3*time.Second)
	if refers := r.bot.Refers(); len(refers) != 1 || refers[0] != "<tel:+15551234567>" {
		t.Fatalf("refers %v", refers)
	}
}

// TestROM011_SendDtmfOnTheStream: SendDtmf on the stream sends RFC 4733 events to the caller in order.
func TestROM011_SendDtmfOnTheStream(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_SendDtmf{SendDtmf: &sessionv1.SendDtmf{Digits: "12#"}}})
	waitStatus(t, call, func(s caller.Status) bool { return s.Digits == "12#" }, 3*time.Second)
}

func TestROM015_ListenerGetsTracksUnmixed(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	// The caller's leg and the app's leg joined with their track ids.
	leg := ac.waitMsg(t, joinedMsg(""), 2*time.Second).GetEvent().GetParticipantJoined()
	callerTrack := uint32(1)
	if leg.GetTrackId() != 1 {
		t.Fatalf("first joined track %d, want the caller's 1", leg.GetTrackId())
	}
	tap, err := rtpio.Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer tap.Close()
	_ = tap.Configure(audio.L16{}, 96, -1, "127.0.0.1", 9)
	m := newMeter()
	go tap.Serve(rtpio.Handlers{Audio: m.hear})
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_AddListener{AddListener: &sessionv1.AddListener{
		ListenerRef: "rec-1", Listen: []*sessionv1.ListenTrack{{TrackId: callerTrack,
			Rtp: &sessionv1.MediaEndpoint{Ip: "127.0.0.1", Port: uint32(tap.Port()), Codec: audio.NameL16}}}}}})
	time.Sleep(100 * time.Millisecond)
	// App audio (track 2) must not reach a listener of track 1.
	ac.play(440, 400)
	time.Sleep(100 * time.Millisecond)
	if n := m.get(0); n > 0 {
		t.Fatalf("listener of the caller's track heard %d frames of app audio", n)
	}
	call.Speak("tone", 400)
	time.Sleep(700 * time.Millisecond)
	if n := m.get(0); n < 10 {
		t.Fatalf("listener heard %d frames of the caller", n)
	}
	ac.send(&sessionv1.AppMessage{Msg: &sessionv1.AppMessage_RemoveListener{RemoveListener: &sessionv1.RemoveListener{ListenerRef: "rec-1"}}})
}

// TestROM027_RoomHeaderJoinsOrCreates: with sip.roomHeader, the first INVITE naming room r creates it,
// the second joins it (Start names it), and the two callers hear each other; the node never
// answers 3xx.
func TestROM027_RoomHeaderJoinsOrCreates(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.RoomHeader = "X-Room-Ref" }})
	ref := fmt.Sprintf("r-%d", time.Now().UnixNano())
	a, err := r.bot.Dial(r.sip, "+1001", "", map[string]string{"X-Room-Ref": ref})
	if err != nil {
		t.Fatal(err)
	}
	acA := r.app.callTo("1001")
	waitStatus(t, a, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	b, err := r.bot.Dial(r.sip, "+1002", "", map[string]string{"X-Room-Ref": ref})
	if err != nil {
		t.Fatal(err)
	}
	acB := r.app.callTo("1002")
	sB := waitStatus(t, b, func(s caller.Status) bool { return s.State == "answered" }, 3*time.Second)
	for _, st := range sB.SIP {
		if st >= 300 && st < 400 {
			t.Fatalf("the node redirected: %v", sB.SIP)
		}
	}
	if acA.start.GetRoomRef() != ref || acB.start.GetRoomRef() != ref || r.node.ActiveRooms() != 1 {
		t.Fatalf("rooms %q and %q, %d active", acA.start.GetRoomRef(), acB.start.GetRoomRef(), r.node.ActiveRooms())
	}
	before := b.Status().AudibleMs
	a.Speak("tone:1000", 400)
	time.Sleep(700 * time.Millisecond)
	if got := b.Status().AudibleMs - before; got < 200 {
		t.Fatalf("the second caller heard %d ms of the first", got)
	}
	// The first caller leaves: the room stays for the second.
	_ = a.Hangup()
	r.waitEvent(typed("call.ended", "call_ref", acA.start.GetCallRef(), "cause", "caller_hangup"), 2*time.Second)
	if r.node.Participants(ref) < 0 {
		t.Fatal("the room ended with a call still in it")
	}
	_ = b.Hangup()
	r.waitEvent(typed("room.ended", "room_ref", ref), 2*time.Second)
}

// TestROM029_MetadataEchoedInStartAndEvents: CreateCall's metadata reaches Start and every event of
// the call untouched.
func TestROM029_MetadataEchoedInStartAndEvents(t *testing.T) {
	r := start(t)
	ref := fmt.Sprintf("md-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(ref))
	md := map[string]string{"app_ref": "app-7", "tenant": "t1"}
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, Metadata: md,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid"}}); err != nil {
		t.Fatal(err)
	}
	ac := r.app.callRef(ref)
	if ac.start.GetMetadata()["app_ref"] != "app-7" || ac.start.GetMetadata()["tenant"] != "t1" {
		t.Fatalf("Start.metadata = %v", ac.start.GetMetadata())
	}
	r.waitEvent(typed("call.answered", "call_ref", ref), 3*time.Second)
	if _, err := r.mc.EndCall(rpcCtx(t), &roomrv1.EndCallRequest{CallRef: ref}); err != nil {
		t.Fatal(err)
	}
	for {
		select {
		case ev := <-events:
			if m := metadataOf(ev); m["app_ref"] != "app-7" || m["tenant"] != "t1" {
				t.Fatalf("event without the metadata: %v", ev)
			}
			if ev["type"] == "call.ended" {
				return
			}
		case <-time.After(3 * time.Second):
			t.Fatal("no call.ended")
		}
	}
}

// TestROM021_CreateCallSessionOverride: CreateCall's session names another endpoint for that call.
func TestROM021_CreateCallSessionOverride(t *testing.T) {
	r := start(t)
	other := startApp(t)
	ref := fmt.Sprintf("so-%d", time.Now().UnixNano())
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref, Session: other.addr,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid"}}); err != nil {
		t.Fatal(err)
	}
	other.callRef(ref)
	r.waitEvent(typed("call.answered", "call_ref", ref), 3*time.Second)
	if n := r.app.count(); n != 0 {
		t.Fatalf("the default endpoint got %d streams", n)
	}
}

// TestROM004_ReadyNeverArrives: the callee answers, the app opens the stream but never sends Ready:
// after the ready timeout the node sends BYE and call.ended app_gone.
func TestROM004_ReadyNeverArrives(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.ReadyTimeout = 700 * time.Millisecond }})
	r.app.setMode(modeStall)
	ref := fmt.Sprintf("nr-%d", time.Now().UnixNano())
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid"}}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", ref, "cause", "app_gone"), 4*time.Second)
	if r.find(typed("call.answered", "call_ref", ref)) != nil {
		t.Fatal("call.answered without Ready")
	}
	waitStatus(t, r.calleeCall(), func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// TestROM004_SessionUnreachableOnAnswer: the callee answers and the session endpoint refuses
// connections: BYE to the callee and call.ended app_gone.
func TestROM004_SessionUnreachableOnAnswer(t *testing.T) {
	dead := fmt.Sprintf("127.0.0.1:%d", freePort(t))
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.SessionEndpoint = dead }})
	ref := fmt.Sprintf("su-%d", time.Now().UnixNano())
	if _, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: ref,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid"}}); err != nil {
		t.Fatal(err)
	}
	r.waitEvent(typed("call.ended", "call_ref", ref, "cause", "app_gone"), 8*time.Second)
	waitStatus(t, r.calleeCall(), func(s caller.Status) bool { return s.State == "ended" }, 3*time.Second)
}

// TestROM036_AppStopsSendingAudio: the app's RTP stops with its stream open: after the media timeout
// the node sends BYE and Ended app_gone.
func TestROM036_AppStopsSendingAudio(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MediaTimeout = 1500 * time.Millisecond }})
	call, ac := r.answeredCall()
	ac.mute()
	waitStatus(t, call, func(s caller.Status) bool { return s.State == "ended" }, 5*time.Second)
	if e := ac.ended(t, 2*time.Second); e.GetCause() != "app_gone" {
		t.Fatalf("Ended = %v", e)
	}
}

// TestROM036_CallerStopsSendingAudio: the caller's RTP stops: the call ends with media_timeout.
func TestROM036_CallerStopsSendingAudio(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.MediaTimeout = 1500 * time.Millisecond }})
	call, ac := r.answeredCall()
	call.SetImpair(func() (int, time.Duration) { return 0, 0 })
	if e := ac.ended(t, 5*time.Second); e.GetCause() != "media_timeout" {
		t.Fatalf("Ended = %v", e)
	}
	r.waitEvent(typed("call.ended", "call_ref", ac.start.GetCallRef(), "cause", "media_timeout"), 2*time.Second)
}

// TestROM006_NoAudioOnTheStream: a call that runs a while carries no audio on its control stream.
func TestROM006_NoAudioOnTheStream(t *testing.T) {
	r := start(t)
	call, ac := r.answeredCall()
	call.Speak("tone", 2000)
	ac.play(440, 2000)
	if n := ac.countMsgs(func(m *sessionv1.NodeMessage) bool {
		return m.GetStart() == nil && m.GetDtmf() == nil && m.GetEvent() == nil
	}); n != 0 {
		t.Fatalf("%d unexpected messages on the stream", n)
	}
	_ = call.Hangup()
}

// replica is a second controller's view of one subject.
func replica(t *testing.T, subject string) chan map[string]any {
	t.Helper()
	nc, err := nats.Connect(envNATS())
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(nc.Close)
	events := make(chan map[string]any, 64)
	if _, err := nc.Subscribe(subject, func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) == nil {
			events <- ev
		}
	}); err != nil {
		t.Fatal(err)
	}
	_ = nc.Flush()
	return events
}

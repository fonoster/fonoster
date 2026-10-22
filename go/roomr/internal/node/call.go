package node

import (
	"context"
	"strings"
	"sync"
	"time"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/telemetry"
)

// Call states.
const (
	CallRinging  = "ringing"
	CallAnswered = "answered"
	CallEnded    = "ended"
)

// WarmTransferTimeout is how long a warm transfer's new party has to answer.
var WarmTransferTimeout = 30 * time.Second

// dialTimeout bounds a dial with no ring timeout of its own (CreateCall, cold transfer).
const dialTimeout = 60 * time.Second

// call is one SIP leg with a lifecycle (inbound caller or CreateCall callee), the app leg its
// control stream negotiated, and the transfer parties it dialed. Every call belongs to a room
// once its leg is up.
type call struct {
	n        *Node
	ref      string
	inbound  bool
	from, to string
	// headers are the INVITE's headers: as received (inbound) or as sent (outbound).
	headers  map[string]string
	metadata map[string]string
	// req is the CreateCall that placed the call (a repeat must match it).
	req CallRequest
	// endpoint is the session endpoint of the call's control stream.
	endpoint string
	done     chan struct{}

	mu          sync.Mutex
	state       string
	roomRef     string
	room        *Room
	leg         *Participant
	app         *Participant
	parties     []*Participant
	appEP       *rtpio.Endpoint
	appKey      string
	sess        *appStream
	answeredAt  time.Time
	maxDuration time.Duration
	ending      bool
	endedAt     time.Time
	cause       string
	sipStatus   int
	// cancelDial cancels a CreateCall dial still ringing; removed is an EndCall while ringing.
	cancelDial context.CancelFunc
	removed    bool
	// reserved: the call holds a MaxRooms place for roomRef until its callee answers.
	reserved bool
	// dialRoom is the existing room a ringing CreateCall dials into (counted as dialing).
	dialRoom *Room
	// warm is a warm transfer's new party, until TransferComplete.
	warm *Participant
	// transferred: a transfer completed and the app left; its stream closing no longer ends
	// the call.
	transferred bool

	evMu     sync.Mutex
	seq      uint64
	evClosed bool

	// endSpan ends the call's span (roomr.call.inbound or roomr.call.outbound, tagged with the
	// call ref; OTLP traces when telemetry is set up, a no-op otherwise).
	endSpan func()
}

func (n *Node) newCall(ref string, inbound bool) *call {
	name := "roomr.call.outbound"
	if inbound {
		name = "roomr.call.inbound"
	}
	_, endSpan := telemetry.StartCall(context.Background(), name, ref)
	return &call{n: n, ref: ref, inbound: inbound, state: CallRinging, done: make(chan struct{}),
		maxDuration: n.cfg.MaxDuration, metadata: map[string]string{}, headers: map[string]string{},
		endSpan: endSpan}
}

// register adds c to the node's call table, forgetting calls that ended longer ago than the
// dedupe window.
func (n *Node) registerLocked(c *call) {
	now := time.Now()
	for ref, old := range n.calls {
		if n.expiredLocked(old, now) {
			delete(n.calls, ref)
		}
	}
	n.calls[c.ref] = c
}

func (n *Node) expiredLocked(c *call, now time.Time) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.ending && !c.endedAt.IsZero() && now.Sub(c.endedAt) > n.window
}

// lookupLocked is the call with ref, unless it ended longer ago than the dedupe window.
func (n *Node) lookupLocked(ref string) *call {
	c := n.calls[ref]
	if c != nil && n.expiredLocked(c, time.Now()) {
		delete(n.calls, ref)
		return nil
	}
	return c
}

func (n *Node) call(ref string) *call {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.lookupLocked(ref)
}

// event publishes one of the call's events on roomr.events.<call_ref> with the next seq; false
// once call.ended went out (the event then belongs to the room).
func (c *call) event(typ string, extra Event) bool {
	c.evMu.Lock()
	defer c.evMu.Unlock()
	if c.evClosed {
		return false
	}
	c.seq++
	ev := c.n.eventBase(typ)
	for k, v := range extra {
		ev[k] = v
	}
	c.mu.Lock()
	ev["call_ref"], ev["room_ref"], ev["seq"], ev["metadata"] = c.ref, c.roomRef, c.seq, c.metadata
	c.mu.Unlock()
	if typ == "call.ended" {
		c.evClosed = true
	}
	// Published under evMu: seq order is publication order.
	c.n.publish(CallEventsSubject(c.ref), ev)
	return true
}

func (c *call) stream() *appStream {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.sess
}

func (c *call) streamParticipant(typ string, p *Participant, cause string) {
	s := c.stream()
	if s == nil {
		return
	}
	ev := &sessionv1.Event{}
	if typ == "participant.joined" {
		ev.Event = &sessionv1.Event_ParticipantJoined{ParticipantJoined: &sessionv1.ParticipantJoined{
			ParticipantRef: p.Ref, TrackId: uint32(p.TrackID)}}
	} else {
		ev.Event = &sessionv1.Event_ParticipantLeft{ParticipantLeft: &sessionv1.ParticipantLeft{
			ParticipantRef: p.Ref, Cause: cause}}
	}
	s.sendEvent(ev)
}

func (c *call) streamDTMF(digit, source string) {
	if s := c.stream(); s != nil {
		s.send(&sessionv1.NodeMessage{Msg: &sessionv1.NodeMessage_Dtmf{Dtmf: &sessionv1.Dtmf{Digit: digit, Source: source}}})
	}
}

func (c *call) streamTransferResult(status, cause string, sipStatus int) {
	if s := c.stream(); s != nil {
		s.sendEvent(&sessionv1.Event{Event: &sessionv1.Event_TransferResult{TransferResult: &sessionv1.TransferResult{
			Status: status, Cause: cause, SipStatus: uint32(sipStatus)}}})
	}
}

// info is the call as Roomr reports it.
func (c *call) info() CallInfo {
	c.mu.Lock()
	defer c.mu.Unlock()
	info := CallInfo{CallRef: c.ref, RoomRef: c.roomRef, State: c.state}
	if c.leg != nil {
		info.ParticipantRef = c.leg.Ref
	}
	return info
}

func (c *call) isEnded() bool {
	select {
	case <-c.done:
		return true
	default:
		return false
	}
}

// lowerMax lowers the call's maximum duration (CreateCall's or Answer's max_duration_s).
func (c *call) lowerMax(seconds uint32) {
	if seconds == 0 {
		return
	}
	d := time.Duration(seconds) * time.Second
	c.mu.Lock()
	if d < c.maxDuration {
		c.maxDuration = d
	}
	c.mu.Unlock()
}

// end ends the call once: an unanswered inbound caller gets a final status (480 unless one is
// given; nothing after its own CANCEL), every leg of the call leaves the room, call.ended goes
// out with the cause, the app gets Ended and its stream closes, and a room the call opened
// ends with its last call.
func (c *call) end(cause string, status int) {
	c.mu.Lock()
	if c.ending {
		c.mu.Unlock()
		return
	}
	c.ending, c.state, c.endedAt, c.cause, c.sipStatus = true, CallEnded, time.Now(), cause, status
	close(c.done)
	cancel, room, leg, app, sess, appEP := c.cancelDial, c.room, c.leg, c.app, c.sess, c.appEP
	parties := append([]*Participant(nil), c.parties...)
	reserved, roomRef := c.reserved, c.roomRef
	c.reserved = false
	answered := !c.answeredAt.IsZero()
	c.mu.Unlock()
	if cancel != nil {
		cancel()
	}
	if c.inbound && leg != nil && !leg.answered.Load() && cause != ReasonCallerHangup {
		st := status
		if st < 300 || st > 699 {
			st = 480
		}
		_ = leg.leg.Reject(st)
	}
	if room != nil {
		for _, p := range append([]*Participant{leg, app}, parties...) {
			if p != nil {
				if taken := room.take(p.Ref); taken != nil {
					room.retire(taken, cause)
				}
			}
		}
	}
	if appEP != nil && app == nil {
		appEP.Close()
	}
	ev := Event{"cause": cause, "answered": answered}
	if status != 0 {
		ev["sip_status"] = status
	}
	c.event("call.ended", ev)
	c.endSpan()
	if sess != nil {
		sess.sendEvent(&sessionv1.Event{Event: &sessionv1.Event_Ended{Ended: &sessionv1.Ended{
			Cause: cause, SipStatus: uint32(status)}}})
		sess.close()
	}
	if reserved {
		c.n.release(roomRef)
	}
	if room != nil && room.dropCall(c) == 0 && room.implicit {
		room.end(cause, status)
	}
}

// participantLeft is told one of the call's participants left the room: the call's SIP leg
// leaving ends the call; a transfer's new party leaving ends it once the app has left too.
func (c *call) participantLeft(p *Participant, cause string) {
	c.mu.Lock()
	isLeg := p == c.leg
	if p == c.app {
		c.app = nil
	}
	if p == c.warm {
		c.warm = nil
	}
	for i, q := range c.parties {
		if q == p {
			c.parties = append(c.parties[:i], c.parties[i+1:]...)
			break
		}
	}
	alone := !isLeg && c.app == nil && len(c.parties) == 0 && p.Kind == KindPhone
	c.mu.Unlock()
	if isLeg || alone {
		c.end(cause, 0)
	}
}

// checkLimits ends an answered call past its maximum duration, or one of whose legs sent no RTP
// for the media timeout: media_timeout for the SIP leg, app_gone for the app's.
func (c *call) checkLimits(now time.Time) {
	c.mu.Lock()
	answered := c.state == CallAnswered && !c.answeredAt.IsZero()
	since, limit, leg, app := c.answeredAt, c.maxDuration, c.leg, c.app
	c.mu.Unlock()
	if !answered {
		return
	}
	timeout := c.n.cfg.MediaTimeout
	switch {
	case now.Sub(since) > limit:
		c.end(ReasonMaxDuration, 0)
	case leg != nil && leg.silentFor(now) > timeout:
		c.end(ReasonMediaTimeout, 0)
	case app != nil && app.silentFor(now) > timeout:
		c.end(ReasonAppGone, 0)
	}
}

// watchLeg ends the call when its SIP leg's dialog ends from the other side.
func (c *call) watchLeg(gone <-chan struct{}, cause string) {
	select {
	case <-gone:
		c.mu.Lock()
		leg := c.leg
		c.mu.Unlock()
		status := 0
		if c.inbound && leg != nil && !leg.answered.Load() {
			status = 487 // CANCEL before the answer
		}
		c.end(cause, status)
	case <-c.done:
	}
}

// openStream opens the call's control stream and sends Start; the app leg's endpoint (the
// node's side of it) is allocated here and announced in Start.
func (c *call) openStream() error {
	ep, err := rtpio.Listen(c.n.cfg.RTPHost)
	if err != nil {
		return err
	}
	key := rtpio.NewSRTPKey()
	c.mu.Lock()
	if c.ending {
		c.mu.Unlock()
		ep.Close()
		return errSessionUnreachable
	}
	c.appEP, c.appKey = ep, key
	c.mu.Unlock()
	s, err := c.n.dialSession(c.endpoint)
	if err != nil {
		return err
	}
	c.mu.Lock()
	if c.ending {
		c.mu.Unlock()
		s.close()
		return errSessionUnreachable
	}
	c.sess = s
	roomRef := c.roomRef
	c.mu.Unlock()
	go s.receive(c.done)
	dir := sessionv1.Start_INBOUND
	if !c.inbound {
		dir = sessionv1.Start_OUTBOUND
	}
	start := &sessionv1.Start{CallRef: c.ref, Direction: dir, From: c.from, To: c.to, Headers: c.headers,
		Metadata: c.metadata, RoomRef: roomRef, NodeRef: c.n.cfg.NodeID,
		Media: mediaEndpoint(c.n.cfg.AdvertiseHost, ep.Port(), audio.NameL16, key)}
	if !s.send(&sessionv1.NodeMessage{Msg: &sessionv1.NodeMessage_Start{Start: start}}) {
		return errSessionUnreachable
	}
	return nil
}

// attachApp turns the app's MediaEndpoint (Answer or Ready) into the call's app leg: RTP
// L16/16000 to it, SRTP when it carries a key, mixed into the room.
func (c *call) attachApp(m *sessionv1.MediaEndpoint) (*Participant, error) {
	if m.GetIp() == "" || m.GetPort() == 0 || m.GetPort() > 65535 {
		return nil, errorf(CodeBadMessage, "media needs ip and port")
	}
	codecName := m.GetCodec()
	if codecName == "" {
		codecName = audio.NameL16
	}
	codec, ok := audio.CodecFor(codecName)
	if !ok {
		return nil, errorf(CodeUnsupportedCodec, "%s", codecName)
	}
	c.mu.Lock()
	ep, key, room := c.appEP, c.appKey, c.room
	c.mu.Unlock()
	if ep == nil || room == nil {
		return nil, errorf(CodeInternal, "no app endpoint")
	}
	pt := defaultPayloadType(codecName)
	if err := ep.Configure(codec, pt, -1, m.GetIp(), int(m.GetPort())); err != nil {
		return nil, errorf(CodeBadMessage, "%s", err.Error())
	}
	if k := m.GetSrtpKey(); k != "" {
		if !rtpio.ValidSRTPKey(k) {
			return nil, errorf(CodeBadMessage, "srtp key must be 30 bytes of base64")
		}
		if err := ep.SetSRTP(key, k); err != nil {
			return nil, errorf(CodeBadMessage, "%s", err.Error())
		}
	}
	p := newParticipant(newRef("p-app"), KindApp, codecName, codec, ep, pt)
	p.call = c
	if err := room.add(p); err != nil {
		return nil, err
	}
	c.mu.Lock()
	if c.ending {
		c.mu.Unlock()
		if taken := room.take(p.Ref); taken != nil {
			taken.endpoint.Close()
		}
		return nil, errRoomEnded
	}
	c.app = p
	c.mu.Unlock()
	go ep.Serve(rtpio.Handlers{Packet: p.push})
	return p, nil
}

// announceAnswered publishes call.answered and the joins of the call's SIP leg and app leg.
func (c *call) announceAnswered() {
	c.mu.Lock()
	leg, app, room := c.leg, c.app, c.room
	c.mu.Unlock()
	if leg == nil || room == nil {
		return
	}
	c.event("call.answered", Event{"participant_ref": leg.Ref})
	room.participantEvent(leg, "participant.joined", "")
	if app != nil {
		room.participantEvent(app, "participant.joined", "")
	}
}

// ---- inbound -----------------------------------------------------------------------------

// headerValue looks a header up by name, ignoring case (SIP header names are case-insensitive).
func headerValue(headers map[string]string, name string) (string, bool) {
	if name == "" {
		return "", false
	}
	for k, v := range headers {
		if strings.EqualFold(k, name) {
			return strings.TrimSpace(v), true
		}
	}
	return "", false
}

// Incoming handles an INVITE (roomr "Inbound calls become rooms"): the caller joins a room
// (the room header's, joined or created, else a new one), hears 180 Ringing, and the node opens
// the call's control stream and sends Start. 200 OK follows the app's Answer; Reject gives its
// status, an unreachable endpoint 503 and no answer in time 480.
func (n *Node) Incoming(in IncomingCall) {
	// fonoster.roomr.calls.incoming by outcome: answered by the app, unanswered (rejected,
	// unreachable endpoint, no answer in time, caller gone) or refused before the app was asked.
	outcome, callRef := "refused", ""
	defer func() { telemetry.CallIncoming(context.Background(), callRef, outcome) }()
	leg := in.Leg
	pt, codecName, ok := in.Media.ChoosePreferred(n.cfg.Codecs...)
	if !ok {
		_ = leg.Reject(488)
		return
	}
	codec, _ := audio.CodecFor(codecName)
	ep, err := rtpio.Listen(n.cfg.RTPHost)
	if err != nil {
		_ = leg.Reject(500)
		return
	}
	if err := ep.Configure(codec, pt, in.Media.DTMF, in.Media.Host, in.Media.Port); err != nil {
		ep.Close()
		_ = leg.Reject(488)
		return
	}
	p := newParticipant(newRef("p-caller"), KindPhone, codecName, codec, ep, pt)
	p.leg = leg
	p.setMedia(in.Media)
	if status := prepareSRTP(p, in.Media); status != 0 {
		ep.Close()
		_ = leg.Reject(status)
		return
	}
	roomRef, join := "", false
	if v, ok := headerValue(in.Headers, n.cfg.RoomHeader); ok && validRef(v) {
		roomRef, join = v, true
	}
	room, err := n.openRoom(roomRef, join, false, true)
	if err != nil {
		ep.Close()
		_ = leg.Reject(503)
		return
	}
	n.mu.Lock()
	ref := ""
	for ref == "" || n.lookupLocked(ref) != nil {
		ref = n.inboundRefLocked(in.Headers, ref)
	}
	c := n.newCall(ref, true)
	callRef = ref
	c.from, c.to, c.headers, c.endpoint = in.From, in.To, in.Headers, n.cfg.SessionEndpoint
	c.room, c.roomRef, c.leg = room, room.Ref, p
	p.call = c
	n.registerLocked(c)
	n.mu.Unlock()
	if c.headers == nil {
		c.headers = map[string]string{}
	}
	c.event("call.started", Event{"direction": "inbound", "from": in.From, "to": in.To, "participant_ref": p.Ref})
	if !room.addCall(c) {
		ep.Close()
		c.end(ReasonNodeError, 503)
		return
	}
	if err := room.add(p); err != nil {
		ep.Close()
		status := 503
		if err == errRoomFull {
			status = 486
		}
		c.mu.Lock()
		c.leg = nil
		c.mu.Unlock()
		_ = leg.Reject(status)
		c.end(ReasonNodeError, status)
		return
	}
	room.servePhone(p)
	_ = leg.Ring()
	c.event("call.ringing", Event{"participant_ref": p.Ref})
	go c.watchLeg(leg.Gone(), ReasonCallerHangup)
	outcome = "unanswered"
	if err := c.openStream(); err != nil {
		n.cfg.Logger.Warn("session endpoint", "callRef", c.ref, "endpoint", c.endpoint, "err", err)
		c.end(ReasonAppGone, 503)
		return
	}
	if c.awaitAnswer() {
		outcome = "answered"
		c.serve()
	}
}

// inboundRefLocked picks an inbound call_ref: the header's on the first try, a generated one
// after (n.mu held).
func (n *Node) inboundRefLocked(headers map[string]string, tried string) string {
	if v, ok := headerValue(headers, n.cfg.CallRefHeader); ok && tried == "" && validRef(v) {
		return v
	}
	return newRef("call")
}

// awaitAnswer waits for the app's Answer or Reject; it reports whether the call was answered.
// Messages the app sent before its stream closed are handled before the close.
func (c *call) awaitAnswer() bool {
	s := c.stream()
	timer := time.NewTimer(c.n.cfg.AnswerTimeout)
	defer timer.Stop()
	for {
		select {
		case <-c.done:
			return false
		case <-s.gone:
			select {
			case m := <-s.msgs:
				if done, answered := c.beforeAnswer(m); done {
					return answered
				}
				continue
			default:
			}
			c.end(ReasonAppGone, 503)
			return false
		case <-timer.C:
			c.end(ReasonAppGone, 480)
			return false
		case m := <-s.msgs:
			if done, answered := c.beforeAnswer(m); done {
				return answered
			}
		}
	}
}

// beforeAnswer handles one message of an inbound call the app has not answered yet.
func (c *call) beforeAnswer(m *sessionv1.AppMessage) (done, answered bool) {
	switch msg := m.GetMsg().(type) {
	case *sessionv1.AppMessage_Answer:
		return true, c.answer(msg.Answer)
	case *sessionv1.AppMessage_Reject:
		status := int(msg.Reject.GetSipStatus())
		if status < 400 || status > 699 {
			status = 603
		}
		c.end(ReasonRejected, status)
		return true, false
	case *sessionv1.AppMessage_Hangup:
		status := int(msg.Hangup.GetSipStatus())
		if status < 400 || status > 699 {
			status = 480
		}
		c.end(ReasonRemoved, status)
		return true, false
	default:
		c.n.cfg.Logger.Warn("command before Answer ignored", "callRef", c.ref)
		return false, false
	}
}

// answer takes the call for the app: its leg joins the room, the caller gets 200 OK.
func (c *call) answer(a *sessionv1.Answer) bool {
	if _, err := c.attachApp(a.GetMedia()); err != nil {
		c.n.cfg.Logger.Warn("answer", "callRef", c.ref, "err", err)
		c.end(ReasonNodeError, 500)
		return false
	}
	c.lowerMax(a.GetMaxDurationS())
	c.mu.Lock()
	leg := c.leg
	c.mu.Unlock()
	if err := leg.leg.Answer(c.n.answerSDP(leg)); err != nil {
		c.n.cfg.Logger.Warn("200 OK", "callRef", c.ref, "err", err)
		c.end(ReasonNodeError, 0)
		return false
	}
	now := time.Now()
	c.mu.Lock()
	if c.ending {
		c.mu.Unlock()
		return false
	}
	leg.since = now
	c.state, c.answeredAt = CallAnswered, now
	c.mu.Unlock()
	leg.answered.Store(true)
	c.announceAnswered()
	return true
}

// ---- after the answer: the app's commands, in order -----------------------------------------

// serve runs the app's commands until the call ends; a broken stream hangs up with app_gone.
func (c *call) serve() {
	s := c.stream()
	for {
		select {
		case <-c.done:
			return
		case <-s.gone:
			select {
			case m := <-s.msgs:
				c.handle(m)
				continue
			default:
			}
			c.mu.Lock()
			transferred := c.transferred
			c.mu.Unlock()
			if transferred {
				s.close() // the app handed the call over; the call goes on without it
				return
			}
			c.n.cfg.Logger.Warn("control stream ended", "callRef", c.ref, "err", s.err)
			c.end(ReasonAppGone, 0)
			return
		case m := <-s.msgs:
			c.handle(m)
		}
	}
}

func (c *call) handle(m *sessionv1.AppMessage) {
	c.mu.Lock()
	room, leg := c.room, c.leg
	c.mu.Unlock()
	if room == nil || leg == nil {
		return
	}
	switch msg := m.GetMsg().(type) {
	case *sessionv1.AppMessage_Hold:
		room.setHold(leg, true, msg.Hold.GetMusic())
	case *sessionv1.AppMessage_Resume:
		room.setHold(leg, false, "")
	case *sessionv1.AppMessage_SendDtmf:
		if validDigits(msg.SendDtmf.GetDigits()) {
			go sendDTMFOn(leg, msg.SendDtmf.GetDigits())
		}
	case *sessionv1.AppMessage_AddListener:
		tracks := make([]ListenTrack, 0, len(msg.AddListener.GetListen()))
		for _, t := range msg.AddListener.GetListen() {
			tracks = append(tracks, ListenTrack{TrackID: int(t.GetTrackId()), RTP: MediaEndpoint{IP: t.GetRtp().GetIp(),
				Port: int(t.GetRtp().GetPort()), Codec: t.GetRtp().GetCodec(), SRTPKey: t.GetRtp().GetSrtpKey()}})
		}
		if _, err := room.addListener(msg.AddListener.GetListenerRef(), tracks); err != nil {
			c.n.cfg.Logger.Warn("add listener", "callRef", c.ref, "err", err)
		}
	case *sessionv1.AppMessage_RemoveListener:
		room.removeListener(msg.RemoveListener.GetListenerRef())
	case *sessionv1.AppMessage_Transfer:
		c.transfer(msg.Transfer)
	case *sessionv1.AppMessage_TransferComplete:
		go c.completeTransfer()
	case *sessionv1.AppMessage_Hangup:
		c.end(ReasonRemoved, 0)
	default:
		// Answer, Ready and Reject after the answer change nothing.
	}
}

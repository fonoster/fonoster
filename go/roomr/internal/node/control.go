package node

import (
	"context"
	"fmt"
	"strings"
	"time"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipheader"
)

// Roomr operations (redesign-roomr, media-control "Roomr is a gRPC service with three nouns"):
// internal/control serves them over gRPC and maps each error code to a gRPC status code, keeping
// the code as the machine-readable reason.

// Error codes.
const (
	CodeAtCapacity          = "at_capacity"
	CodeRoomExists          = "room_exists"
	CodeCallExists          = "call_exists"
	CodeRoomNotFound        = "room_not_found"
	CodeCallNotFound        = "call_not_found"
	CodeParticipantNotFound = "participant_not_found"
	CodeRoomFull            = "room_full"
	CodeBadMessage          = "bad_message"
	CodeUnsupportedCodec    = "unsupported_codec"
	CodeNotSupported        = "not_supported"
	CodeInternal            = "internal"
)

// Error is a refused operation.
type Error struct {
	Code    string
	Message string
}

func (e *Error) Error() string {
	if e.Message == "" {
		return e.Code
	}
	return e.Code + ": " + e.Message
}

func errorf(code, format string, args ...any) *Error {
	return &Error{Code: code, Message: fmt.Sprintf(format, args...)}
}

func seconds(s uint32) time.Duration { return time.Duration(s) * time.Second }

// check validates a dial target: a Request-URI, one-line URIs, and pass-through headers that
// are SIP tokens with one-line values (a CR or LF is refused) and not ones the node sets.
func (t SipTarget) check() error {
	if strings.TrimSpace(t.URI) == "" {
		return errorf(CodeBadMessage, "to.uri is required")
	}
	if strings.ContainsAny(t.URI+t.Proxy, "\r\n") {
		return errorf(CodeBadMessage, "to.uri and to.proxy must be one line")
	}
	if err := sipheader.Validate(t.Headers); err != nil {
		return errorf(CodeBadMessage, "%s", err.Error())
	}
	return nil
}

// CallInfo is a Call as Roomr reports it.
type CallInfo struct {
	CallRef, RoomRef, ParticipantRef, State string
}

// CallRequest is CreateCall's input.
type CallRequest struct {
	CallRef, RoomRef, From string
	To                     SipTarget
	// Session overrides the node's session endpoint for this call.
	Session     string
	RingTimeout time.Duration
	MaxDuration time.Duration
	// Metadata is opaque to the node, echoed in every event of the call and in Start.
	Metadata map[string]string
}

// sameCall reports whether two CreateCall requests for one call_ref ask for the same call.
func sameCall(a, b CallRequest) bool {
	same := func(x, y map[string]string) bool {
		if len(x) != len(y) {
			return false
		}
		for k, v := range x {
			if w, ok := y[k]; !ok || w != v {
				return false
			}
		}
		return true
	}
	return a.CallRef == b.CallRef && a.RoomRef == b.RoomRef && a.From == b.From && a.Session == b.Session &&
		a.RingTimeout == b.RingTimeout && a.MaxDuration == b.MaxDuration && same(a.Metadata, b.Metadata) &&
		a.To.URI == b.To.URI && a.To.Proxy == b.To.Proxy && same(a.To.Headers, b.To.Headers) &&
		a.To.Username == b.To.Username && a.To.Password == b.To.Password
}

// CreateCall dials req.To (media-control "CreateCall dials out on the node the controller
// chose") and returns the Call ringing. The callee's room (req.RoomRef, joined or created, else
// a new one) is created only on 200 OK; until then a place is held toward MaxRooms. The
// configured call-ref header in req.To.Headers names the call when call_ref is empty (both set
// and different: bad_message). A repeated call_ref returns the call it names (ended calls for
// the dedupe window), or call_exists when the request differs.
func (n *Node) CreateCall(req CallRequest) (CallInfo, error) {
	if err := req.To.check(); err != nil {
		return CallInfo{}, err
	}
	if v, ok := headerValue(req.To.Headers, n.cfg.CallRefHeader); ok {
		switch {
		case !validRef(v):
			return CallInfo{}, errorf(CodeBadMessage, "header %s must be one token without dots or spaces", n.cfg.CallRefHeader)
		case req.CallRef != "" && req.CallRef != v:
			return CallInfo{}, errorf(CodeBadMessage, "call_ref and header %s differ", n.cfg.CallRefHeader)
		}
		req.CallRef = v
	}
	if req.CallRef != "" && !validRef(req.CallRef) {
		return CallInfo{}, errorf(CodeBadMessage, "call_ref must be one token without dots or spaces")
	}
	if req.RoomRef != "" && !validRef(req.RoomRef) {
		return CallInfo{}, errorf(CodeBadMessage, "room_ref must be one token without dots or spaces")
	}
	if req.CallRef == "" {
		req.CallRef = newRef("call")
	}
	if n.targetDialer() == nil {
		return CallInfo{}, errorf(CodeNotSupported, "this node has no SIP user agent")
	}
	n.mu.Lock()
	if c := n.lookupLocked(req.CallRef); c != nil {
		n.mu.Unlock()
		if c.inbound || !sameCall(c.req, req) {
			return CallInfo{}, errorf(CodeCallExists, "call %s exists with other parameters", req.CallRef)
		}
		return c.info(), nil
	}
	roomRef := req.RoomRef
	if roomRef == "" {
		roomRef = newRef("room")
	}
	existing := n.rooms[roomRef]
	if existing == nil && n.reserved[roomRef] == 0 && n.loadLocked() >= n.cfg.MaxRooms {
		n.mu.Unlock()
		return CallInfo{}, n.atCapacity()
	}
	if existing == nil {
		n.reserved[roomRef]++
	}
	c := n.newCall(req.CallRef, false)
	c.req, c.from, c.to, c.roomRef, c.reserved = req, req.From, req.To.URI, roomRef, existing == nil
	c.endpoint = req.Session
	if c.endpoint == "" {
		c.endpoint = n.cfg.SessionEndpoint
	}
	if req.Metadata != nil {
		c.metadata = req.Metadata
	}
	for k, v := range req.To.Headers {
		c.headers[k] = v
	}
	timeout := req.RingTimeout
	if timeout <= 0 {
		timeout = dialTimeout
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	c.cancelDial = cancel
	if req.MaxDuration > 0 {
		c.lowerMax(uint32(req.MaxDuration / time.Second))
	}
	n.registerLocked(c)
	n.mu.Unlock()
	if existing != nil {
		// A room waiting on this dial is not an empty room.
		existing.dialStarted()
		c.mu.Lock()
		c.dialRoom = existing
		c.mu.Unlock()
	}
	info := c.info()
	c.event("call.started", Event{"direction": "outbound", "from": req.From, "to": req.To.URI})
	go c.runOutbound(ctx, cancel)
	return info, nil
}

// runOutbound dials, and on 200 OK creates or joins the room, opens the control stream, sends
// Start and waits for Ready. Busy, no answer or a rejection end the call with no room and no
// stream.
func (c *call) runOutbound(ctx context.Context, cancel context.CancelFunc) {
	defer cancel()
	c.event("call.ringing", nil)
	p, err := c.n.dialOut(ctx, c.req.To, c.req.From, nil)
	c.mu.Lock()
	dialRoom, removed := c.dialRoom, c.removed
	c.dialRoom, c.cancelDial = nil, nil
	c.mu.Unlock()
	emptied := false
	if dialRoom != nil {
		emptied = dialRoom.dialEnded()
	}
	if err != nil {
		status := dialStatus(err)
		cause := failCause(status)
		if removed {
			cause, status = ReasonRemoved, 0
		}
		if c.isEnded() {
			return
		}
		c.n.cfg.Logger.Info("create call failed", "callRef", c.ref, "sipStatus", status, "cause", cause)
		c.end(cause, status)
		if emptied {
			// A dial that fails in an otherwise empty room ends the room with its outcome.
			dialRoom.end(cause, status)
		}
		return
	}
	c.mu.Lock()
	reserved, roomRef, ending := c.reserved, c.roomRef, c.ending
	c.reserved = false
	c.mu.Unlock()
	if ending {
		if reserved {
			c.n.release(roomRef)
		}
		_ = p.out.Bye()
		p.endpoint.Close()
		return
	}
	room, err := c.n.openRoom(roomRef, true, reserved, true)
	if err == nil && !room.addCall(c) {
		err = errRoomEnded
	}
	if err == nil {
		c.mu.Lock()
		c.room = room
		c.mu.Unlock()
		err = c.joinLeg(room, p)
	}
	if err != nil {
		c.n.cfg.Logger.Warn("answered call has no room", "callRef", c.ref, "err", err)
		_ = p.out.Bye()
		p.endpoint.Close()
		c.end(ReasonNodeError, 0)
		return
	}
	if removed {
		c.end(ReasonRemoved, 0)
		return
	}
	if err := c.openStream(); err != nil {
		c.n.cfg.Logger.Warn("session endpoint", "callRef", c.ref, "endpoint", c.endpoint, "err", err)
		c.end(ReasonAppGone, 0)
		return
	}
	if c.awaitReady() {
		c.serve()
	}
}

// joinLeg adds the answered callee to the room as the call's SIP leg.
func (c *call) joinLeg(room *Room, p *Participant) error {
	p.call = c
	if err := room.add(p); err != nil {
		return err
	}
	now := time.Now()
	c.mu.Lock()
	c.leg, c.state, c.answeredAt = p, CallAnswered, now
	c.mu.Unlock()
	room.servePhone(p)
	go c.watchLeg(p.out.Gone(), ReasonCalleeHangup)
	return nil
}

// awaitReady waits for the app's Ready on an answered outbound call; no Ready within the ready
// timeout, or a broken stream, hangs up with app_gone.
func (c *call) awaitReady() bool {
	s := c.stream()
	timer := time.NewTimer(c.n.cfg.ReadyTimeout)
	defer timer.Stop()
	handle := c.beforeReady
	for {
		select {
		case <-c.done:
			return false
		case <-s.gone:
			select {
			case m := <-s.msgs:
				if done, ok := handle(m); done {
					return ok
				}
				continue
			default:
			}
			c.end(ReasonAppGone, 0)
			return false
		case <-timer.C:
			c.end(ReasonAppGone, 0)
			return false
		case m := <-s.msgs:
			if done, ok := handle(m); done {
				return ok
			}
		}
	}
}

// beforeReady handles one message of an answered outbound call the app is not ready for yet
// (Answer is taken as Ready).
func (c *call) beforeReady(m *sessionv1.AppMessage) (done, ok bool) {
	var media *sessionv1.MediaEndpoint
	switch msg := m.GetMsg().(type) {
	case *sessionv1.AppMessage_Ready:
		media = msg.Ready.GetMedia()
	case *sessionv1.AppMessage_Answer:
		media = msg.Answer.GetMedia()
		c.lowerMax(msg.Answer.GetMaxDurationS())
	case *sessionv1.AppMessage_Hangup, *sessionv1.AppMessage_Reject:
		c.end(ReasonRemoved, 0)
		return true, false
	default:
		c.n.cfg.Logger.Warn("command before Ready ignored", "callRef", c.ref)
		return false, false
	}
	if _, err := c.attachApp(media); err != nil {
		c.n.cfg.Logger.Warn("ready", "callRef", c.ref, "err", err)
		c.end(ReasonNodeError, 0)
		return true, false
	}
	c.announceAnswered()
	return true, true
}

// EndCall ends a call: CANCEL while ringing, BYE once answered, and an unanswered inbound call
// is refused (480); the cause is removed.
func (n *Node) EndCall(ref string) error {
	c := n.call(ref)
	if c == nil {
		return errorf(CodeCallNotFound, "%s", ref)
	}
	c.mu.Lock()
	state, cancel := c.state, c.cancelDial
	if state == CallRinging && !c.inbound && cancel != nil {
		c.removed = true
	}
	c.mu.Unlock()
	switch {
	case state == CallEnded:
		return nil
	case state == CallRinging && !c.inbound && cancel != nil:
		cancel() // the dial ends with CANCEL; runOutbound ends the call with cause removed
	default:
		go c.end(ReasonRemoved, 0)
	}
	return nil
}

// GetCall reports a call by call_ref.
func (n *Node) GetCall(ref string) (CallInfo, error) {
	c := n.call(ref)
	if c == nil {
		return CallInfo{}, errorf(CodeCallNotFound, "%s", ref)
	}
	return c.info(), nil
}

// RoomOptions are CreateRoom's per-room overrides; zero keeps the node's setting. MaxDuration
// can only lower the node's limit.
type RoomOptions struct {
	MaxDuration     time.Duration
	EmptyTimeout    time.Duration
	MaxParticipants int
}

// CreateRoom creates an empty room (ref "" picks one).
func (n *Node) CreateRoom(ref string, o RoomOptions) (string, error) {
	if ref != "" && !validRef(ref) {
		return "", errorf(CodeBadMessage, "room_ref must be one token without dots or spaces")
	}
	r, err := n.openRoom(ref, false, false, false)
	if err != nil {
		return "", err
	}
	r.setMaxDuration(o.MaxDuration)
	r.mu.Lock()
	if o.EmptyTimeout > 0 {
		r.emptyTimeout = o.EmptyTimeout
	}
	if o.MaxParticipants > 0 {
		r.maxParticipants = o.MaxParticipants
	}
	r.mu.Unlock()
	return r.Ref, nil
}

// EndRoom ends every call and participant in the room (cause removed).
func (n *Node) EndRoom(ref string) error {
	r := n.room(ref)
	if r == nil {
		return errorf(CodeRoomNotFound, "%s", ref)
	}
	go r.end(ReasonRemoved, 0)
	return nil
}

// MediaEndpoint is an RTP address (Roomr's MediaEndpoint).
type MediaEndpoint struct {
	IP      string
	Port    int
	Codec   string
	SRTPKey string
}

// ParticipantInfo is a Participant as Roomr reports it.
type ParticipantInfo struct {
	ParticipantRef, RoomRef string
	TrackID                 int
	// RTP is the node's side of an RTP participant's leg.
	RTP *MediaEndpoint
}

// ListenTrack is one track a listener receives, unmixed.
type ListenTrack struct {
	TrackID int
	RTP     MediaEndpoint
}

// AddRTPParticipant adds an RTP participant to a room (AddParticipant with an rtp endpoint).
func (n *Node) AddRTPParticipant(roomRef string, m MediaEndpoint) (ParticipantInfo, error) {
	r := n.room(roomRef)
	if r == nil {
		return ParticipantInfo{}, errorf(CodeRoomNotFound, "%s", roomRef)
	}
	codecName := m.Codec
	if codecName == "" {
		codecName = audio.NameL16
	}
	codec, ok := audio.CodecFor(codecName)
	if !ok {
		return ParticipantInfo{}, errorf(CodeUnsupportedCodec, "%s", codecName)
	}
	if m.SRTPKey != "" && !rtpio.ValidSRTPKey(m.SRTPKey) {
		return ParticipantInfo{}, errorf(CodeBadMessage, "srtp key must be 30 bytes of base64")
	}
	r.mu.Lock()
	full := len(r.participants) >= r.maxParticipants
	r.mu.Unlock()
	if full {
		return ParticipantInfo{}, errRoomFull
	}
	ep, err := rtpio.Listen(n.cfg.RTPHost)
	if err != nil {
		return ParticipantInfo{}, errorf(CodeInternal, "%s", err.Error())
	}
	pt := defaultPayloadType(codecName)
	if err := ep.Configure(codec, pt, -1, m.IP, m.Port); err != nil {
		ep.Close()
		return ParticipantInfo{}, errorf(CodeBadMessage, "%s", err.Error())
	}
	p := newParticipant(newRef("p-rtp"), KindRTP, codecName, codec, ep, pt)
	if m.SRTPKey != "" {
		p.srtpKey = rtpio.NewSRTPKey()
		if err := ep.SetSRTP(p.srtpKey, m.SRTPKey); err != nil {
			ep.Close()
			return ParticipantInfo{}, errorf(CodeBadMessage, "%s", err.Error())
		}
	}
	if err := r.add(p); err != nil {
		ep.Close()
		return ParticipantInfo{}, err
	}
	go ep.Serve(rtpio.Handlers{Packet: p.push})
	r.participantEvent(p, "participant.joined", "")
	return ParticipantInfo{ParticipantRef: p.Ref, RoomRef: r.Ref, TrackID: p.TrackID,
		RTP: &MediaEndpoint{IP: n.cfg.AdvertiseHost, Port: ep.Port(), Codec: codecName, SRTPKey: p.srtpKey}}, nil
}

// AddListenerParticipant adds a listen-only participant (AddParticipant with listen tracks).
func (n *Node) AddListenerParticipant(roomRef string, tracks []ListenTrack) (ParticipantInfo, error) {
	r := n.room(roomRef)
	if r == nil {
		return ParticipantInfo{}, errorf(CodeRoomNotFound, "%s", roomRef)
	}
	ref, err := r.addListener("", tracks)
	if err != nil {
		return ParticipantInfo{}, err
	}
	return ParticipantInfo{ParticipantRef: ref, RoomRef: r.Ref}, nil
}

// findParticipant is the room holding a participant or listener (roomRef, when given, narrows
// the search).
func (n *Node) findParticipant(roomRef, ref string) (*Room, *Participant) {
	var rooms []*Room
	if roomRef != "" {
		if r := n.room(roomRef); r != nil {
			rooms = append(rooms, r)
		}
	} else {
		rooms = n.allRooms()
	}
	for _, r := range rooms {
		r.mu.Lock()
		p := r.participants[ref]
		_, listener := r.listeners[ref]
		r.mu.Unlock()
		if p != nil || listener {
			return r, p
		}
	}
	return nil, nil
}

// RemoveParticipant removes a participant or a listener (cause removed). Removing a call's SIP
// leg ends the call.
func (n *Node) RemoveParticipant(roomRef, ref string) error {
	if roomRef != "" && n.room(roomRef) == nil {
		return errorf(CodeRoomNotFound, "%s", roomRef)
	}
	r, p := n.findParticipant(roomRef, ref)
	switch {
	case r == nil:
		return errorf(CodeParticipantNotFound, "%s", ref)
	case p != nil:
		go r.remove(ref, ReasonRemoved)
	default:
		r.removeListener(ref)
	}
	return nil
}

func validDigits(digits string) bool {
	if digits == "" {
		return false
	}
	for _, d := range digits {
		if rtpio.DigitEvent(d) < 0 {
			return false
		}
	}
	return true
}

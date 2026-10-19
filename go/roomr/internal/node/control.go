package node

import (
	"context"
	"fmt"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sipheader"
)

// Roomr operations (redesign-roomr, "Roomr is a gRPC service with three
// nouns"). They sit next to the NATS command handlers and call the same room operations
// (newRoom, addSession, attachListener, remove, hangupAll, dialParty's leg setup), so both
// paths behave alike; internal/control serves them over gRPC.

// Error codes the operations return; internal/control maps each to a gRPC status code and
// keeps the code as the machine-readable reason. The NATS handlers' codes (bad_message,
// room_full, unsupported_codec, ...) pass through unchanged.
const (
	CodeAtCapacity          = "at_capacity"
	CodeRoomExists          = "room_exists"
	CodeCallExists          = "call_exists"
	CodeRoomNotFound        = "room_not_found"
	CodeCallNotFound        = "call_not_found"
	CodeParticipantNotFound = "participant_not_found"
	CodeRoomFull            = "room_full"
	CodeBadMessage          = "bad_message"
	CodeNotSupported        = "not_supported"
	CodeCallNotAnswered     = "call_not_answered"
	CodeNoDTMF              = "dtmf_not_negotiated"
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

// Errors newRoomRef returns: the ref is taken, or the node holds MaxRooms rooms.
var (
	errRoomExists = &Error{Code: CodeRoomExists}
	errAtCapacity = &Error{Code: CodeAtCapacity}
)

// SipTarget is where CreateCall dials: the Request-URI, the proxy the INVITE goes to (empty:
// the Request-URI's host), headers added untouched and optional digest credentials.
type SipTarget struct {
	URI, Proxy         string
	Headers            map[string]string
	Username, Password string
}

// TargetDialer places a CreateCall leg (sipua.UA). It returns the answered leg and the answer
// SDP, or a *DialError with the final status.
type TargetDialer interface {
	DialTarget(ctx Context, t SipTarget, from string, offer []byte, onProgress func(status int)) (OutLeg, []byte, error)
}

// SetTargetDialer gives the node a way to place CreateCall legs.
func (n *Node) SetTargetDialer(d TargetDialer) {
	n.ctl.mu.Lock()
	n.ctl.dialer = d
	n.ctl.mu.Unlock()
}

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

// Call states.
const (
	CallRinging  = "ringing"
	CallAnswered = "answered"
	CallEnded    = "ended"
)

// CallInfo is a Call as Roomr reports it.
type CallInfo struct {
	CallRef, RoomRef, ParticipantRef, State string
}

type callEntry struct {
	info CallInfo
	// req is the CreateCall that placed the call (zero for inbound calls): a repeat must match it.
	req     CallRequest
	inbound bool
	// removed is an EndCall while ringing: the dial was cancelled on purpose.
	removed bool
	cancel  context.CancelFunc
	endedAt time.Time
}

// CallDedupeWindow is how long an ended call is remembered: a repeated CreateCall for its
// call_ref returns the call instead of dialing again.
const CallDedupeWindow = 10 * time.Minute

// headerValue looks a header up by name, ignoring case (SIP header names are case-insensitive).
func headerValue(headers map[string]string, name string) (string, bool) {
	if name == "" {
		return "", false
	}
	for k, v := range headers {
		if strings.EqualFold(k, name) {
			return v, true
		}
	}
	return "", false
}

// wellFormedRef reports whether a call-ref header value can be a call_ref (one subject token).
func wellFormedRef(v string) bool { return v != "" && validToken(v) }

// inboundCallRef is an inbound call's call_ref: the configured call-ref header's value when it
// is well formed and names no call the node knows, else a new ref.
func (n *Node) inboundCallRef(headers map[string]string) string {
	if v, ok := headerValue(headers, n.cfg.CallRefHeader); ok && wellFormedRef(v) && n.ctl.get(v) == nil {
		return v
	}
	return n.nextRef("call")
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
	return a.CallRef == b.CallRef && a.RoomRef == b.RoomRef && a.From == b.From &&
		a.RingTimeout == b.RingTimeout && a.MaxDuration == b.MaxDuration && same(a.Metadata, b.Metadata) &&
		a.To.URI == b.To.URI && a.To.Proxy == b.To.Proxy && same(a.To.Headers, b.To.Headers) &&
		a.To.Username == b.To.Username && a.To.Password == b.To.Password
}

// callTable is the node's calls by call_ref (CreateCall, and inbound calls with X-Call-Ref).
type callTable struct {
	mu     sync.Mutex
	calls  map[string]*callEntry
	dialer TargetDialer
	// window is the dedupe window (CallDedupeWindow).
	window time.Duration
}

// expired reports whether an ended call is past the dedupe window.
func (t *callTable) expired(e *callEntry, now time.Time) bool {
	return !e.endedAt.IsZero() && now.Sub(e.endedAt) > t.window
}

func (t *callTable) putLocked(e *callEntry) {
	if t.calls == nil {
		t.calls = map[string]*callEntry{}
	}
	now := time.Now()
	for ref, old := range t.calls {
		if t.expired(old, now) {
			delete(t.calls, ref)
		}
	}
	t.calls[e.info.CallRef] = e
}

// lookupLocked is the call with ref, unless it ended longer ago than the dedupe window.
func (t *callTable) lookupLocked(ref string) *callEntry {
	e := t.calls[ref]
	if e != nil && t.expired(e, time.Now()) {
		delete(t.calls, ref)
		return nil
	}
	return e
}

func (t *callTable) get(ref string) *callEntry {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.lookupLocked(ref)
}

func (t *callTable) endLocked(e *callEntry) {
	if e.info.State != CallEnded {
		e.info.State, e.endedAt = CallEnded, time.Now()
	}
}

// trackInbound records an inbound call so EndCall can find it.
func (n *Node) trackInbound(callRef, roomRef, participantRef string) {
	if callRef == "" {
		return
	}
	n.ctl.mu.Lock()
	defer n.ctl.mu.Unlock()
	n.ctl.putLocked(&callEntry{inbound: true, info: CallInfo{CallRef: callRef, RoomRef: roomRef,
		ParticipantRef: participantRef, State: CallRinging}})
}

// callsRoomEnded marks every call in an ended room as ended.
func (n *Node) callsRoomEnded(roomRef string) {
	n.ctl.mu.Lock()
	defer n.ctl.mu.Unlock()
	for _, e := range n.ctl.calls {
		if e.info.RoomRef == roomRef {
			n.ctl.endLocked(e)
		}
	}
}

// callInfo is the entry's current state: a call whose participant left is ended, and an
// inbound call is ringing until the app answers it.
func (n *Node) callInfo(e *callEntry) CallInfo {
	n.ctl.mu.Lock()
	info := e.info
	n.ctl.mu.Unlock()
	if info.State == CallEnded || (info.State == CallRinging && !e.inbound) {
		return info
	}
	var p *Participant
	if r := n.room(info.RoomRef); r != nil {
		r.mu.Lock()
		p = r.participants[info.ParticipantRef]
		r.mu.Unlock()
	}
	n.ctl.mu.Lock()
	defer n.ctl.mu.Unlock()
	switch {
	case p == nil:
		n.ctl.endLocked(e)
	case e.inbound:
		p.mu.Lock()
		answered := p.answered
		p.mu.Unlock()
		e.info.State = CallRinging
		if answered {
			e.info.State = CallAnswered
		}
	}
	return e.info
}

// CallRequest is CreateCall's input.
type CallRequest struct {
	CallRef, RoomRef, From string
	To                     SipTarget
	RingTimeout            time.Duration
	MaxDuration            time.Duration
	// Metadata is passed through untouched to the call's events.
	Metadata map[string]string
}

// createRoom is newRoomRef for Roomr: ref "" picks one, callRef ("" for none) is the
// CreateCall the room is opened for. At the room limit it fails with at_capacity
// (RESOURCE_EXHAUSTED), like room.create and inbound INVITEs (503).
func (n *Node) createRoom(ref, callRef string) (*Room, error) {
	r, err := n.newRoomRef(ref, callRef)
	if err == errAtCapacity {
		return nil, errorf(CodeAtCapacity, "node %s holds its limit of %d rooms", n.cfg.NodeID, n.cfg.MaxRooms)
	}
	return r, err
}

func maxDurationCmd(d time.Duration) Command {
	return Command{"maxDurationSec": d.Seconds()}
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
	r, err := n.createRoom(ref, "")
	if err != nil {
		return "", err
	}
	r.setMaxDuration(maxDurationCmd(o.MaxDuration))
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

// EndRoom ends every call and participant in the room (cause removed), like room.end.
func (n *Node) EndRoom(ref string) error {
	r := n.room(ref)
	if r == nil {
		return errorf(CodeRoomNotFound, "%s", ref)
	}
	go r.hangupAll(ReasonRemoved, 0, "")
	return nil
}

// CreateCall dials req.To into req.RoomRef (created when missing, or a new room) and returns
// the Call ringing; progress and the answer are published as events, as for participant.dial.
// The configured call-ref header in req.To.Headers names the call when call_ref is empty (both
// set and different: bad_message). A repeated call_ref returns the call it names (ended calls
// for the dedupe window), or call_exists when the request differs.
func (n *Node) CreateCall(req CallRequest) (CallInfo, error) {
	if err := req.To.check(); err != nil {
		return CallInfo{}, err
	}
	if v, ok := headerValue(req.To.Headers, n.cfg.CallRefHeader); ok {
		switch {
		case !wellFormedRef(v):
			return CallInfo{}, errorf(CodeBadMessage, "header %s must be one token without dots or spaces", n.cfg.CallRefHeader)
		case req.CallRef != "" && req.CallRef != v:
			return CallInfo{}, errorf(CodeBadMessage, "call_ref and header %s differ", n.cfg.CallRefHeader)
		}
		req.CallRef = v
	}
	if req.CallRef == "" {
		req.CallRef = n.nextRef("call")
	}
	n.ctl.mu.Lock()
	if e := n.ctl.lookupLocked(req.CallRef); e != nil {
		n.ctl.mu.Unlock()
		if e.inbound || !sameCall(e.req, req) {
			return CallInfo{}, errorf(CodeCallExists, "call %s exists with other parameters", req.CallRef)
		}
		return n.callInfo(e), nil
	}
	dialer := n.ctl.dialer
	if dialer == nil {
		n.ctl.mu.Unlock()
		return CallInfo{}, errorf(CodeNotSupported, "this node has no SIP user agent")
	}
	var r *Room
	if req.RoomRef != "" {
		r = n.room(req.RoomRef)
	}
	if r == nil {
		var err error
		if r, err = n.createRoom(req.RoomRef, req.CallRef); err != nil {
			n.ctl.mu.Unlock()
			return CallInfo{}, err
		}
	}
	timeout := req.RingTimeout
	if timeout <= 0 {
		timeout = dialTimeout
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	e := &callEntry{info: CallInfo{CallRef: req.CallRef, RoomRef: r.Ref, State: CallRinging},
		req: req, cancel: cancel}
	n.ctl.putLocked(e)
	info := e.info
	n.ctl.mu.Unlock()
	// A room waiting on this dial is not an empty room (orphans.go).
	r.dialStarted()
	n.openCall(req.CallRef, r.Ref, "", req.Metadata, Event{"direction": "outbound", "from": req.From, "to": req.To.URI})
	r.setMaxDuration(maxDurationCmd(req.MaxDuration))
	go n.runCall(ctx, cancel, r, e, req, dialer)
	return info, nil
}

// failCause is a failed dial's ending cause.
func failCause(status int) string {
	switch progressStatus(status) {
	case "busy":
		return "busy"
	case "no_answer":
		return "no_answer"
	default:
		return ReasonRejected
	}
}

func (n *Node) runCall(ctx context.Context, cancel context.CancelFunc, r *Room, e *callEntry,
	req CallRequest, dialer TargetDialer) {
	defer cancel()
	ref := req.CallRef
	event := func(typ string, extra Event) Event {
		ev := Event{"type": typ, "id": ref, "callRef": ref}
		if len(req.Metadata) > 0 {
			ev["metadata"] = req.Metadata
		}
		for k, v := range extra {
			ev[k] = v
		}
		return ev
	}
	n.emit(r.Ref, event("call.progress", Event{"status": "ringing"}))
	p, err := r.dialLeg(func(offer []byte, onProgress func(int)) (OutLeg, []byte, error) {
		return dialer.DialTarget(ctx, req.To, req.From, offer, onProgress)
	}, func() {})
	empty := r.dialEnded()
	n.ctl.mu.Lock()
	removed := e.removed
	if err != nil {
		n.ctl.endLocked(e)
	} else {
		e.info.State, e.info.ParticipantRef = CallAnswered, p.Ref
	}
	n.ctl.mu.Unlock()
	if err != nil {
		status := dialStatus(err)
		cause := failCause(status)
		if removed {
			cause = ReasonRemoved
		}
		n.cfg.Logger.Warn("create call failed", "room", r.Ref, "callRef", ref, "err", err)
		n.emit(r.Ref, event("call.progress", Event{"status": progressStatus(status), "sipStatus": status, "cause": cause}))
		if empty {
			// A dial that fails in an otherwise empty room ends the room with its outcome.
			r.end(cause, status, ref)
		}
		return
	}
	n.emit(r.Ref, event("call.answered", Event{"participantRef": p.Ref}))
	n.emit(r.Ref, event("participant.joined", Event{"participantRef": p.Ref, "tracks": p.tracks()}))
	if removed {
		// EndCall raced the answer.
		r.remove(p.Ref, ref, ReasonRemoved)
	}
}

// EndCall ends a call: CANCEL while ringing, BYE once answered; an inbound call ends its room,
// like hangup.
func (n *Node) EndCall(ref string) error {
	e := n.ctl.get(ref)
	if e == nil {
		return errorf(CodeCallNotFound, "%s", ref)
	}
	info := n.callInfo(e)
	switch {
	case info.State == CallEnded:
		return nil
	case e.inbound:
		if r := n.room(info.RoomRef); r != nil {
			go r.hangupAll(ReasonRemoved, 0, "")
		}
	case info.State == CallRinging:
		n.ctl.mu.Lock()
		e.removed = true
		n.ctl.mu.Unlock()
		e.cancel()
	default:
		if r := n.room(info.RoomRef); r != nil {
			go r.remove(info.ParticipantRef, ref, ReasonRemoved)
		}
	}
	return nil
}

// GetCall reports a call by call_ref.
func (n *Node) GetCall(ref string) (CallInfo, error) {
	e := n.ctl.get(ref)
	if e == nil {
		return CallInfo{}, errorf(CodeCallNotFound, "%s", ref)
	}
	return n.callInfo(e), nil
}

// MediaEndpoint is an RTP address (Roomr's MediaEndpoint).
type MediaEndpoint struct {
	IP      string
	Port    int
	Codec   string
	SRTPKey string
}

func (m MediaEndpoint) block() map[string]any {
	b := map[string]any{"host": m.IP, "port": float64(m.Port), "codec": m.Codec}
	if m.SRTPKey != "" {
		b["srtp"] = map[string]any{"suite": rtpio.SRTPSuite, "key": m.SRTPKey}
	}
	return b
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

func commandError(reply Command) error {
	if reply["type"] != "error" {
		return nil
	}
	code, _ := reply["code"].(string)
	msg, _ := reply["message"].(string)
	return &Error{Code: code, Message: msg}
}

// JoinRTP adds an RTP participant to a room, as participant.add does for AppBridge's leg.
func (n *Node) JoinRTP(roomRef string, ep MediaEndpoint) (ParticipantInfo, error) {
	r := n.room(roomRef)
	if r == nil {
		return ParticipantInfo{}, errorf(CodeRoomNotFound, "%s", roomRef)
	}
	ack := func(extra Command) Command { extra["type"] = "ack"; return extra }
	fail := func(code, message string) Command {
		return Command{"type": "error", "code": code, "message": message}
	}
	reply := r.addSession(Command{"id": n.nextRef("join"), "rtp": ep.block()}, ack, fail)
	if err := commandError(reply); err != nil {
		return ParticipantInfo{}, err
	}
	ref, _ := reply["participantRef"].(string)
	info := ParticipantInfo{ParticipantRef: ref, RoomRef: r.Ref}
	r.mu.Lock()
	if p := r.participants[ref]; p != nil {
		info.TrackID = p.TrackID
	}
	r.mu.Unlock()
	if block, ok := reply["rtp"].(Command); ok {
		local := MediaEndpoint{IP: n.cfg.AdvertiseHost, Codec: ep.Codec}
		local.Port, _ = block["port"].(int)
		if s, ok := block["srtp"].(Command); ok {
			local.SRTPKey, _ = s["key"].(string)
		}
		info.RTP = &local
	}
	return info, nil
}

// JoinListener attaches a listen-only participant, as listener.attach does.
func (n *Node) JoinListener(roomRef string, tracks []ListenTrack) (ParticipantInfo, error) {
	r := n.room(roomRef)
	if r == nil {
		return ParticipantInfo{}, errorf(CodeRoomNotFound, "%s", roomRef)
	}
	list := make([]any, 0, len(tracks))
	for _, t := range tracks {
		list = append(list, map[string]any{"trackId": float64(t.TrackID), "rtp": t.RTP.block()})
	}
	ack := func(extra Command) Command { extra["type"] = "ack"; return extra }
	fail := func(code, message string) Command {
		return Command{"type": "error", "code": code, "message": message}
	}
	reply := r.attachListener(Command{"tracks": list}, ack, fail)
	if err := commandError(reply); err != nil {
		return ParticipantInfo{}, err
	}
	ref, _ := reply["listenerRef"].(string)
	return ParticipantInfo{ParticipantRef: ref, RoomRef: r.Ref}, nil
}

// findParticipant is the room holding a participant (roomRef, when given, narrows the search).
func (n *Node) findParticipant(roomRef, ref string) (*Room, *Participant) {
	var rooms []*Room
	if roomRef != "" {
		if r := n.room(roomRef); r != nil {
			rooms = append(rooms, r)
		}
	} else {
		n.mu.Lock()
		for _, r := range n.rooms {
			rooms = append(rooms, r)
		}
		n.mu.Unlock()
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

// Leave removes a participant or a listener (cause removed), as participant.remove and
// listener.detach do.
func (n *Node) Leave(roomRef, ref string) error {
	if roomRef != "" && n.room(roomRef) == nil {
		return errorf(CodeRoomNotFound, "%s", roomRef)
	}
	r, p := n.findParticipant(roomRef, ref)
	switch {
	case r == nil:
		return errorf(CodeParticipantNotFound, "%s", ref)
	case p != nil:
		go r.remove(ref, "", ReasonRemoved)
	default:
		r.detachListener(ref)
	}
	return nil
}

// Target names what Play and SendDtmf act on: a call, a participant or (Play only) a room.
type Target struct {
	CallRef, ParticipantRef, RoomRef string
}

// resolve finds the room and, unless the target is the room, the participant.
func (n *Node) resolve(t Target) (*Room, *Participant, error) {
	switch {
	case t.CallRef != "":
		e := n.ctl.get(t.CallRef)
		if e == nil {
			return nil, nil, errorf(CodeCallNotFound, "%s", t.CallRef)
		}
		info := n.callInfo(e)
		switch info.State {
		case CallRinging:
			return nil, nil, errorf(CodeCallNotAnswered, "%s", t.CallRef)
		case CallEnded:
			return nil, nil, errorf(CodeCallNotFound, "%s has ended", t.CallRef)
		}
		r, p := n.findParticipant(info.RoomRef, info.ParticipantRef)
		if p == nil {
			return nil, nil, errorf(CodeCallNotFound, "%s has ended", t.CallRef)
		}
		return r, p, nil
	case t.ParticipantRef != "":
		r, p := n.findParticipant(t.RoomRef, t.ParticipantRef)
		if p == nil {
			return nil, nil, errorf(CodeParticipantNotFound, "%s", t.ParticipantRef)
		}
		return r, p, nil
	case t.RoomRef != "":
		r := n.room(t.RoomRef)
		if r == nil {
			return nil, nil, errorf(CodeRoomNotFound, "%s", t.RoomRef)
		}
		return r, nil, nil
	}
	return nil, nil, errorf(CodeBadMessage, "a call_ref, participant_ref or room_ref is required")
}

// Play fetches a WAV and plays it to the target (everyone in a room target); operation.done
// reports the end.
func (n *Node) Play(t Target, fileURL string) (string, error) {
	u, err := url.Parse(fileURL)
	if err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
		return "", errorf(CodeBadMessage, "url must be an http(s) URL")
	}
	r, p, err := n.resolve(t)
	if err != nil {
		return "", err
	}
	target := ""
	if p != nil {
		target = p.Ref
	}
	ref := n.nextRef("op")
	go r.play(ref, target, fileURL)
	return ref, nil
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

// SendDTMF sends RFC 4733 events on the target SIP leg, as dtmf.send does on the caller's.
func (n *Node) SendDTMF(t Target, digits string) error {
	if !validDigits(digits) {
		return errorf(CodeBadMessage, "digits must be 0-9, *, # or A-D")
	}
	if t.CallRef == "" && t.ParticipantRef == "" {
		return errorf(CodeBadMessage, "a call_ref or participant_ref is required")
	}
	_, p, err := n.resolve(t)
	if err != nil {
		return err
	}
	if p.Kind != KindPhone {
		return errorf(CodeBadMessage, "%s is not a SIP leg", p.Ref)
	}
	if p.media.DTMF < 0 {
		return errorf(CodeNoDTMF, "%s did not negotiate telephone-event", p.Ref)
	}
	go sendDTMFOn(p, digits)
	return nil
}

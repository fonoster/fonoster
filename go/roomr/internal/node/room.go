package node

import (
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/dtmf"
	"github.com/fonoster/fonoster/go/roomr/internal/jitter"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
	"github.com/pion/rtp"
)

// Kinds of participants.
const (
	// KindPhone is a SIP leg: an inbound caller, a dialed callee or a transfer's new party.
	KindPhone = "phone"
	// KindApp is a call's app leg (RTP to the app that holds the call's control stream).
	KindApp = "app"
	// KindRTP is a plain RTP participant added with Join.
	KindRTP = "rtp"
)

// DTMF sources (Dtmf on the control stream).
const (
	SourceRFC4733 = "rfc4733"
	SourceSIPInfo = "sip_info"
	SourceInband  = "inband"
)

// dtmfDedupWindow: the same digit from a second source within this window is the same keypress.
const dtmfDedupWindow = 500 * time.Millisecond

// Participant is one party in a room, with one audio track.
type Participant struct {
	Ref      string
	Kind     string
	TrackID  int
	Codec    string
	endpoint *rtpio.Endpoint
	leg      CallLeg // inbound caller
	out      OutLeg  // dialed party
	media    sdp.Media
	pt       int
	// call is the call this participant belongs to (its SIP leg, app leg or a transfer's new
	// party); nil for RTP participants.
	call *call
	// answered: a SIP leg gets audio only once answered (no early media).
	answered atomic.Bool
	// announced: participant.joined went out (participant.left follows only then).
	announced atomic.Bool
	// since is when the participant joined (media timeouts count from it at the earliest).
	since time.Time
	// srtpKey is the node's SDES key on an encrypted leg ("" for plain RTP); cryptoTag answers
	// the offer's a=crypto tag.
	srtpKey   string
	cryptoTag int

	// codec decodes what the jitter buffer releases. It is also the endpoint's encoder; G.722
	// and Opus keep encoder and decoder state apart, and both run on the room's clock.
	codec      audio.Codec
	jb         *jitter.Buffer
	last       audio.Frame
	concealRun int

	// DTMF: RFC 4733 when negotiated, SIP INFO when the peer sends it, in-band otherwise.
	inband      *dtmf.Detector
	infoSeen    atomic.Bool
	dtmfMu      sync.Mutex
	lastDigit   string
	lastDigitAt time.Time
	lastSource  string
}

func newParticipant(ref, kind, codecName string, codec audio.Codec, ep *rtpio.Endpoint, pt int) *Participant {
	return &Participant{Ref: ref, Kind: kind, Codec: codecName, codec: codec, endpoint: ep, pt: pt, jb: jitter.New()}
}

func (p *Participant) tracks() []Event {
	return []Event{{"track_id": p.TrackID, "kind": "audio", "codec": p.Codec}}
}

// silentFor is how long the participant has sent no RTP (counted from when it joined at most).
func (p *Participant) silentFor(now time.Time) time.Duration {
	last := p.endpoint.LastPacketAt()
	if p.since.After(last) {
		last = p.since
	}
	return now.Sub(last)
}

func (p *Participant) push(pkt *rtp.Packet) { p.jb.Push(pkt) }

// pull is one tick of this participant's audio: the next frame from the jitter buffer, decoded,
// a concealment frame for a loss, or nil (silence).
func (p *Participant) pull() audio.Frame {
	if p.jb == nil || p.codec == nil {
		return nil
	}
	res, payload := p.jb.Pop()
	var f audio.Frame
	switch res {
	case jitter.Played:
		f = p.codec.Decode(payload)
		p.last, p.concealRun = f, 0
	case jitter.Lost:
		p.concealRun++
		if c, ok := p.codec.(audio.Concealer); ok {
			f = c.Conceal()
		} else if p.last != nil && p.concealRun <= 3 {
			// Repeat the last frame, fading out over three frames.
			f = make(audio.Frame, len(p.last))
			for i, s := range p.last {
				f[i] = int16(int32(s) * int32(4-p.concealRun) / 4)
			}
		}
	}
	return f
}

// hold is a participant on hold: it hears music (or silence) and nobody hears it.
type hold struct {
	music []audio.Frame
	pos   int
}

// fork sends one participant's track, unmixed, to a listener's RTP destination.
type fork struct {
	trackID  int
	endpoint *rtpio.Endpoint
}

// Room mixes audio so each participant hears everyone but themselves (mix-minus).
type Room struct {
	Ref     string
	node    *Node
	created time.Time
	// implicit: the room was opened by a call (an INVITE or CreateCall) and ends with its last
	// call; rooms from CreateRoom end with EndRoom or the empty-room timeout.
	implicit bool

	mu           sync.Mutex
	participants map[string]*Participant
	order        []string
	nextTrack    int
	held         map[string]*hold
	ended        bool
	done         chan struct{}
	listeners    map[string][]fork
	calls        map[string]*call
	// maxDuration, maxParticipants and emptyTimeout are the node's, or the room's own
	// (CreateRoom).
	maxDuration     time.Duration
	maxParticipants int
	emptyTimeout    time.Duration
	// dialing counts CreateCall dials into this room still ringing; idleSince is when the room
	// was created, or last became empty with no dial in progress.
	dialing   int
	idleSince time.Time

	// evMu orders the room's events; seq is their per-room sequence.
	evMu sync.Mutex
	seq  uint64
}

func newRoom(n *Node, ref string, implicit bool) *Room {
	now := time.Now()
	return &Room{Ref: ref, node: n, created: now, implicit: implicit, maxDuration: n.cfg.MaxDuration,
		maxParticipants: n.cfg.MaxParticipants, emptyTimeout: n.cfg.EmptyRoomTimeout,
		participants: map[string]*Participant{}, held: map[string]*hold{}, calls: map[string]*call{},
		done: make(chan struct{}), idleSince: now}
}

var (
	errRoomFull  = &Error{Code: CodeRoomFull, Message: "the room holds its participant limit"}
	errRoomEnded = &Error{Code: CodeRoomNotFound, Message: "the room has ended"}
)

func (r *Room) add(p *Participant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.ended {
		return errRoomEnded
	}
	if len(r.participants) >= r.maxParticipants {
		return errRoomFull
	}
	r.nextTrack++
	p.TrackID = r.nextTrack
	p.since = time.Now()
	r.participants[p.Ref] = p
	r.order = append(r.order, p.Ref)
	return nil
}

// addCall makes c one of the room's calls (false when the room has ended).
func (r *Room) addCall(c *call) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.ended {
		return false
	}
	r.calls[c.ref] = c
	return true
}

// dropCall removes c and reports how many calls remain.
func (r *Room) dropCall(c *call) int {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.calls, c.ref)
	return len(r.calls)
}

func (r *Room) callList() []*call {
	r.mu.Lock()
	defer r.mu.Unlock()
	out := make([]*call, 0, len(r.calls))
	for _, c := range r.calls {
		out = append(out, c)
	}
	return out
}

func (r *Room) participant(ref string) *Participant {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.participants[ref]
}

// event publishes one room-scoped event on roomr.events.room.<room_ref> with the room's seq.
func (r *Room) event(typ string, extra Event) {
	r.evMu.Lock()
	defer r.evMu.Unlock()
	r.seq++
	ev := r.node.eventBase(typ)
	for k, v := range extra {
		ev[k] = v
	}
	ev["room_ref"], ev["seq"] = r.Ref, r.seq
	r.node.publish(RoomEventsSubject(r.Ref), ev)
}

// participantEvent reports a participant joining or leaving: on its call's subject when it
// belongs to a call, else on the room's, and to the control stream of every call in the room.
func (r *Room) participantEvent(p *Participant, typ, cause string) {
	if typ == "participant.joined" {
		if p.announced.Swap(true) {
			return
		}
	} else if !p.announced.Swap(false) {
		return
	}
	ev := Event{"participant_ref": p.Ref, "track_id": p.TrackID, "kind": p.Kind, "tracks": p.tracks()}
	if cause != "" {
		ev["cause"] = cause
	}
	if p.call == nil || !p.call.event(typ, ev) {
		r.event(typ, ev)
	}
	for _, c := range r.callList() {
		c.streamParticipant(typ, p, cause)
	}
}

// reportDTMF sends one keypress to the call the leg belongs to, dropping the same digit from a
// second source within the de-duplication window (each keypress reported once).
func (r *Room) reportDTMF(p *Participant, digit, source string) {
	p.dtmfMu.Lock()
	dup := digit == p.lastDigit && source != p.lastSource && time.Since(p.lastDigitAt) < dtmfDedupWindow
	if !dup {
		p.lastDigit, p.lastSource = digit, source
	}
	p.lastDigitAt = time.Now()
	p.dtmfMu.Unlock()
	if dup || p.call == nil {
		return
	}
	p.call.streamDTMF(digit, source)
}

// servePhone starts receiving a SIP leg's RTP, with RFC 4733 events and, when neither RFC 4733 nor
// SIP INFO is in use, in-band detection on the decoded audio.
func (r *Room) servePhone(p *Participant) {
	for _, leg := range []any{p.leg, p.out} {
		if src, ok := leg.(DTMFSource); ok {
			src.OnDTMF(func(d string) {
				p.infoSeen.Store(true)
				r.reportDTMF(p, d, SourceSIPInfo)
			})
		}
	}
	go p.endpoint.Serve(rtpio.Handlers{
		Packet: p.push,
		Skip:   p.jb.Skip,
		DTMF:   func(d string) { r.reportDTMF(p, d, SourceRFC4733) },
	})
}

// setMedia records a SIP leg's negotiated media; without telephone-event, keypresses are
// detected in-band. Called before the participant joins a room.
func (p *Participant) setMedia(m sdp.Media) {
	p.media = m
	if m.DTMF < 0 {
		p.inband = &dtmf.Detector{}
	}
}

// prepareSRTP keys the endpoint when the offer is SAVP (SDES-SRTP is optional: a plain offer
// stays plain). It returns a SIP status on refusal.
func prepareSRTP(p *Participant, m sdp.Media) int {
	if !m.Secure {
		return 0
	}
	for _, c := range m.Crypto {
		if c.Suite == rtpio.SRTPSuite && rtpio.ValidSRTPKey(c.Key) {
			p.srtpKey, p.cryptoTag = rtpio.NewSRTPKey(), c.Tag
			if err := p.endpoint.SetSRTP(p.srtpKey, c.Key); err != nil {
				return 488
			}
			return 0
		}
	}
	return 488
}

// answerSDP is the node's answer for an inbound SIP leg.
func (n *Node) answerSDP(c *Participant) []byte {
	d := sdp.Description{Host: n.cfg.AdvertiseHost, Port: c.endpoint.Port(),
		Codecs: []sdp.Codec{{PT: c.pt, Name: c.Codec}}, DTMF: c.media.DTMF}
	if c.srtpKey != "" {
		d.Crypto = &sdp.Crypto{Tag: c.cryptoTag, Suite: rtpio.SRTPSuite, Key: c.srtpKey}
	}
	return sdp.WriteDescription(d)
}

// take removes a participant from the room's tables; nil when it is not there.
func (r *Room) take(ref string) *Participant {
	r.mu.Lock()
	defer r.mu.Unlock()
	p := r.participants[ref]
	if p == nil {
		return nil
	}
	delete(r.participants, ref)
	delete(r.held, ref)
	for i, o := range r.order {
		if o == ref {
			r.order = append(r.order[:i], r.order[i+1:]...)
			break
		}
	}
	if len(r.participants) == 0 && r.dialing == 0 {
		r.idleSince = time.Now()
	}
	return p
}

// remove takes a participant out with cause: a SIP leg gets a BYE unless its side hung up, the
// RTP endpoint closes and participant.left is reported. A call's leg leaving may end its call.
func (r *Room) remove(ref, cause string) bool {
	p := r.take(ref)
	if p == nil {
		return false
	}
	r.retire(p, cause)
	return true
}

// retire finishes a participant taken out of the room.
func (r *Room) retire(p *Participant, cause string) {
	// A SIP participant gets BYE unless its own dialog already ended (its side hung up). Another
	// party's hang-up (the caller leaving a transferred call) still hangs this one up.
	if p.Kind == KindPhone {
		if p.out != nil {
			if !closed(p.out.Gone()) {
				_ = p.out.Bye()
			}
		} else if p.leg != nil && p.answered.Load() && !closed(p.leg.Gone()) {
			_ = p.leg.Bye()
		}
	}
	p.endpoint.Close()
	r.participantEvent(p, "participant.left", cause)
	if p.call != nil {
		p.call.participantLeft(p, cause)
	}
}

// end ends the room: every call in it, every participant and listener; then
// room.ended (cause, sip_status) and the node forgets it. It runs once.
func (r *Room) end(cause string, status int) {
	r.mu.Lock()
	if r.ended {
		r.mu.Unlock()
		return
	}
	r.ended = true
	calls := make([]*call, 0, len(r.calls))
	for _, c := range r.calls {
		calls = append(calls, c)
	}
	r.mu.Unlock()
	// Calls still ringing into the room (CreateCall with its room_ref) end with it: their callee
	// must not open the room again on 200 OK.
	calls = append(calls, r.node.dialingInto(r)...)
	for _, c := range calls {
		c.end(cause, status)
	}
	r.mu.Lock()
	parts := make([]*Participant, 0, len(r.order))
	for _, ref := range r.order {
		parts = append(parts, r.participants[ref])
	}
	r.participants, r.order, r.held = map[string]*Participant{}, nil, map[string]*hold{}
	listeners := r.listeners
	r.listeners = nil
	r.mu.Unlock()
	close(r.done)
	for _, p := range parts {
		removed := cause
		if p.Kind == KindRTP {
			removed = ReasonRemoved
		}
		r.retire(p, removed)
	}
	for _, fs := range listeners {
		for _, f := range fs {
			f.endpoint.Close()
		}
	}
	// The node frees the room's place before it says so: a controller that reacts to room.ended
	// at once finds the place free.
	r.node.roomEnded(r)
	ev := Event{"cause": cause}
	if status != 0 {
		ev["sip_status"] = status
	}
	r.event("room.ended", ev)
}

// setHold cuts a participant off from the others and loops hold audio (or silence) to it; Resume
// (held false) restores both directions.
func (r *Room) setHold(p *Participant, held bool, musicURL string) {
	if p == nil {
		return
	}
	r.mu.Lock()
	if !held {
		delete(r.held, p.Ref)
		r.mu.Unlock()
		return
	}
	h := &hold{}
	r.held[p.Ref] = h
	r.mu.Unlock()
	if musicURL == "" {
		return
	}
	go func() {
		frames, err := r.node.fetchHoldAudio(musicURL)
		if err != nil {
			r.node.cfg.Logger.Warn("hold music", "url", musicURL, "err", err)
			return
		}
		r.mu.Lock()
		if r.held[p.Ref] == h {
			h.music = frames
		}
		r.mu.Unlock()
	}()
}

// sendDTMFOn sends RFC 4733 events on a SIP leg that negotiated telephone-event.
func sendDTMFOn(p *Participant, digits string) {
	if p.media.DTMF < 0 {
		return
	}
	for _, d := range digits {
		p.endpoint.SendDTMF(d, p.media.DTMF)
	}
}

// dialStarted and dialEnded bracket a CreateCall dial into this room: a room waiting on a dial
// is not empty.
func (r *Room) dialStarted() {
	r.mu.Lock()
	r.dialing++
	r.mu.Unlock()
}

// dialEnded reports whether the room is now empty with no other dial in progress.
func (r *Room) dialEnded() (empty bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.dialing--
	empty = r.dialing == 0 && len(r.participants) == 0
	if empty {
		r.idleSince = time.Now()
	}
	return empty
}

// maxCatchUp is how many missed 20 ms ticks the clock replays after a stall; beyond that the
// frames are counted as dropped.
const maxCatchUp = 5

// run is the room's clock: every 20 ms each participant gets the mix of the others. A late
// wake-up replays the ticks it missed so no frame is skipped.
func (r *Room) run() {
	period := audio.FrameMs * time.Millisecond
	next := time.Now().Add(period)
	timer := time.NewTimer(period)
	defer timer.Stop()
	ticks := 0
	for {
		select {
		case <-r.done:
			return
		case <-timer.C:
		}
		now := time.Now()
		due := int(now.Sub(next)/period) + 1
		if due > maxCatchUp {
			next = next.Add(time.Duration(due-maxCatchUp) * period)
			due = maxCatchUp
		}
		for i := 0; i < due; i++ {
			r.tick()
			next = next.Add(period)
			if ticks++; ticks%50 == 0 {
				go r.checkLimits()
			}
		}
		timer.Reset(time.Until(next))
	}
}

func (r *Room) tick() {
	r.mu.Lock()
	parts := make([]*Participant, 0, len(r.order))
	for _, ref := range r.order {
		parts = append(parts, r.participants[ref])
	}
	music := make(map[string]audio.Frame, len(r.held))
	for ref, h := range r.held {
		var f audio.Frame
		if len(h.music) > 0 {
			f = h.music[h.pos%len(h.music)]
			h.pos++
		}
		music[ref] = f
	}
	var forks []fork
	for _, fs := range r.listeners {
		forks = append(forks, fs...)
	}
	r.mu.Unlock()

	frames := make([]audio.Frame, len(parts))
	byTrack := map[int]audio.Frame{}
	for i, p := range parts {
		frames[i] = p.pull()
		byTrack[p.TrackID] = frames[i]
		if p.inband != nil && frames[i] != nil && !p.infoSeen.Load() {
			if digit, ok := p.inband.Feed(frames[i]); ok {
				r.reportDTMF(p, digit, SourceInband)
			}
		}
	}
	for _, f := range forks {
		frame := byTrack[f.trackID]
		if frame == nil {
			frame = audio.Silence()
		}
		f.endpoint.Send(frame)
	}
	for i, p := range parts {
		if p.Kind == KindPhone && !p.answered.Load() {
			continue // no early media
		}
		if out, held := music[p.Ref]; held {
			if out == nil {
				out = audio.Silence()
			}
			p.endpoint.Send(out)
			continue
		}
		others := make([]audio.Frame, 0, len(parts))
		for j, q := range parts {
			if i == j {
				continue
			}
			if _, held := music[q.Ref]; held {
				continue
			}
			others = append(others, frames[j])
		}
		p.endpoint.Send(audio.Mix(others...))
	}
}

// checkLimits runs about once a second: the room's maximum duration, the empty-room timeout,
// and each call's own limits (maximum duration, media timeouts).
func (r *Room) checkLimits() {
	now := time.Now()
	r.mu.Lock()
	limit := r.maxDuration
	empty := len(r.participants) == 0 && r.dialing == 0
	idle := now.Sub(r.idleSince)
	emptyTimeout := r.emptyTimeout
	ended := r.ended
	r.mu.Unlock()
	if ended {
		return
	}
	if now.Sub(r.created) > limit {
		r.end(ReasonMaxDuration, 0)
		return
	}
	if empty && emptyTimeout > 0 && idle > emptyTimeout {
		r.node.cfg.Logger.Warn("ending an empty room", "room", r.Ref, "idle", idle.String())
		r.end(ReasonNodeError, 0)
		return
	}
	for _, c := range r.callList() {
		c.checkLimits(now)
	}
}

// setMaxDuration lowers the room's limit; it never raises it.
func (r *Room) setMaxDuration(d time.Duration) {
	if d <= 0 {
		return
	}
	r.mu.Lock()
	if d < r.maxDuration {
		r.maxDuration = d
	}
	r.mu.Unlock()
}

// addListener adds a listen-only participant: one RTP stream per selected track, never
// mixed, receive-only. ref "" picks one.
func (r *Room) addListener(ref string, tracks []ListenTrack) (string, error) {
	if len(tracks) == 0 {
		return "", errorf(CodeBadMessage, "a listener needs tracks")
	}
	var forks []fork
	closeAll := func() {
		for _, f := range forks {
			f.endpoint.Close()
		}
	}
	for _, t := range tracks {
		codecName := t.RTP.Codec
		if codecName == "" {
			codecName = audio.NameL16
		}
		codec, ok := audio.CodecFor(codecName)
		if t.RTP.IP == "" || t.RTP.Port == 0 || !ok {
			closeAll()
			return "", errorf(CodeBadMessage, "each track needs rtp {ip, port} and a supported codec")
		}
		if t.RTP.SRTPKey != "" && !rtpio.ValidSRTPKey(t.RTP.SRTPKey) {
			closeAll()
			return "", errorf(CodeBadMessage, "srtp key must be 30 bytes of base64")
		}
		ep, err := rtpio.Listen(r.node.cfg.RTPHost)
		if err != nil {
			closeAll()
			return "", errorf(CodeInternal, "%s", err.Error())
		}
		if err := ep.Configure(codec, defaultPayloadType(codecName), -1, t.RTP.IP, t.RTP.Port); err != nil {
			ep.Close()
			closeAll()
			return "", errorf(CodeBadMessage, "%s", err.Error())
		}
		if t.RTP.SRTPKey != "" {
			// A listener only receives, so its own key encrypts what the node sends it.
			_ = ep.SetSRTP(t.RTP.SRTPKey, t.RTP.SRTPKey)
		}
		forks = append(forks, fork{trackID: t.TrackID, endpoint: ep})
	}
	if ref == "" {
		ref = newRef("listener")
	}
	r.mu.Lock()
	if r.ended {
		r.mu.Unlock()
		closeAll()
		return "", errRoomEnded
	}
	if r.listeners == nil {
		r.listeners = map[string][]fork{}
	}
	if old := r.listeners[ref]; old != nil {
		for _, f := range old {
			f.endpoint.Close()
		}
	}
	r.listeners[ref] = forks
	r.mu.Unlock()
	return ref, nil
}

// removeListener closes a listener's streams; false when there was none.
func (r *Room) removeListener(ref string) bool {
	r.mu.Lock()
	forks, ok := r.listeners[ref]
	delete(r.listeners, ref)
	r.mu.Unlock()
	for _, f := range forks {
		f.endpoint.Close()
	}
	return ok
}

func defaultPayloadType(codec string) int {
	if pt := audio.StaticPayloadType(codec); pt >= 0 {
		return pt
	}
	return 96
}

// String names the room in logs.
func (r *Room) String() string { return fmt.Sprintf("room %s", r.Ref) }

// closed reports whether ch is closed, without waiting.
func closed(ch <-chan struct{}) bool {
	select {
	case <-ch:
		return true
	default:
		return false
	}
}

// dialingInto lists the CreateCall dials still ringing into room r.
func (n *Node) dialingInto(r *Room) []*call {
	n.mu.Lock()
	all := make([]*call, 0, len(n.calls))
	for _, c := range n.calls {
		all = append(all, c)
	}
	n.mu.Unlock()
	var out []*call
	for _, c := range all {
		c.mu.Lock()
		if c.dialRoom == r {
			out = append(out, c)
		}
		c.mu.Unlock()
	}
	return out
}

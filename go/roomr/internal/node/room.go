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
	KindPhone   = "phone"
	KindSession = "session"
)

// DTMF sources (media-control `dtmf` event).
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
	answered bool
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

	// DTMF: RFC 4733 when negotiated, SIP INFO when the peer sends it, in-band otherwise (MN8).
	inband      *dtmf.Detector
	infoSeen    atomic.Bool
	dtmfMu      sync.Mutex
	lastDigit   string
	lastDigitAt time.Time
	lastSource  string

	mu sync.Mutex
}

func (p *Participant) tracks() []Event {
	return []Event{{"trackId": p.TrackID, "kind": "audio", "codec": p.Codec, "direction": "sendrecv"}}
}

func newParticipant(ref, kind, codecName string, codec audio.Codec, ep *rtpio.Endpoint, pt int) *Participant {
	return &Participant{Ref: ref, Kind: kind, Codec: codecName, codec: codec, endpoint: ep, pt: pt, jb: jitter.New()}
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

// Room mixes audio so each participant hears everyone but themselves (mix-minus).
type Room struct {
	Ref     string
	node    *Node
	created time.Time
	// maxDuration is the node's limit, or an app's lower one.
	maxDuration time.Duration
	// callRef is the API-originated call the room was created for (room.create callRef); the
	// call's events go to CallEventsSubject (callevents.go). Set before the room is shared.
	callRef string

	mu           sync.Mutex
	participants map[string]*Participant
	order        []string
	nextTrack    int
	heldRef      string // the participant on hold, if any
	music        []audio.Frame
	musicPos     int
	ended        bool
	done         chan struct{}
	listeners    map[string][]fork
	// plays are Roomr Play operations in progress.
	plays []*playback
	// stats of participants that already left (the node's totals include them).
	goneStats jitter.Stats
	orphan    orphanState
}

// fork sends one participant's track, unmixed, to a listener's RTP destination.
type fork struct {
	trackID  int
	endpoint *rtpio.Endpoint
}

// rtpBlock is media-control's `rtp` object.
type rtpBlock struct {
	host        string
	port        int
	codec       string
	payloadType int
	ptime       int
	srtpKey     string // "" without srtp
	hasSRTP     bool
	badSRTP     string
}

func parseRTPBlock(v any) rtpBlock {
	block, _ := v.(map[string]any)
	b := rtpBlock{payloadType: -1, ptime: 20}
	b.host, _ = block["host"].(string)
	if port, ok := block["port"].(float64); ok {
		b.port = int(port)
	}
	b.codec, _ = block["codec"].(string)
	if v, ok := block["payloadType"].(float64); ok {
		b.payloadType = int(v)
	}
	if v, ok := block["ptime"].(float64); ok {
		b.ptime = int(v)
	}
	if s, ok := block["srtp"].(map[string]any); ok {
		b.hasSRTP = true
		suite, _ := s["suite"].(string)
		key, _ := s["key"].(string)
		switch {
		case suite != "" && suite != rtpio.SRTPSuite:
			b.badSRTP = "unsupported srtp suite " + suite
		case !rtpio.ValidSRTPKey(key):
			b.badSRTP = "srtp key must be 30 bytes of base64"
		default:
			b.srtpKey = key
		}
	}
	return b
}

func defaultPayloadType(codec string) int {
	if pt := audio.StaticPayloadType(codec); pt >= 0 {
		return pt
	}
	return 96
}

// attachListener is listener.attach: one RTP stream per selected track, never mixed, receive-only.
func (r *Room) attachListener(cmd Command, ack replyFn, fail failFn) Command {
	tracks, _ := cmd["tracks"].([]any)
	if len(tracks) == 0 {
		return fail("bad_message", "listener.attach needs tracks")
	}
	forks := []fork{}
	closeAll := func() {
		for _, f := range forks {
			f.endpoint.Close()
		}
	}
	for _, t := range tracks {
		track, _ := t.(map[string]any)
		id, _ := track["trackId"].(float64)
		block := parseRTPBlock(track["rtp"])
		if block.codec == "" {
			block.codec = audio.NameL16
		}
		codec, ok := audio.CodecFor(block.codec)
		if block.host == "" || block.port == 0 || !ok {
			closeAll()
			return fail("bad_message", "each track needs rtp {host, port} and a supported codec")
		}
		if block.badSRTP != "" {
			closeAll()
			return fail("bad_message", block.badSRTP)
		}
		if r.node.cfg.RequireEncryption && !block.hasSRTP {
			closeAll()
			return fail("encryption_required", "this node requires srtp on every rtp block")
		}
		ep, err := rtpio.Listen(r.node.cfg.RTPHost)
		if err != nil {
			closeAll()
			return fail("internal", err.Error())
		}
		pt := block.payloadType
		if pt < 0 {
			pt = defaultPayloadType(block.codec)
		}
		_ = ep.Configure(codec, pt, -1, block.host, block.port)
		if block.srtpKey != "" {
			// A listener only receives, so its own key encrypts what the node sends it.
			_ = ep.SetSRTP(block.srtpKey, block.srtpKey)
		}
		forks = append(forks, fork{trackID: int(id), endpoint: ep})
	}
	ref := r.node.nextRef("listener")
	r.mu.Lock()
	if r.listeners == nil {
		r.listeners = map[string][]fork{}
	}
	r.listeners[ref] = forks
	r.mu.Unlock()
	return ack(Command{"listenerRef": ref, "participantRef": ref})
}

func (r *Room) detachListener(ref string) bool {
	r.mu.Lock()
	forks, ok := r.listeners[ref]
	delete(r.listeners, ref)
	r.mu.Unlock()
	for _, f := range forks {
		f.endpoint.Close()
	}
	return ok
}

func newRoom(n *Node, ref string) *Room {
	now := time.Now()
	return &Room{Ref: ref, node: n, created: now, maxDuration: n.cfg.MaxDuration,
		participants: map[string]*Participant{}, done: make(chan struct{}), orphan: orphanState{idleSince: now}}
}

// errRoomFull is the 11th participant (MN11).
var errRoomFull = fmt.Errorf("room_full")

func (r *Room) add(p *Participant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.ended {
		return fmt.Errorf("room ended")
	}
	if len(r.participants) >= r.node.cfg.MaxParticipants {
		return errRoomFull
	}
	r.nextTrack++
	p.TrackID = r.nextTrack
	r.participants[p.Ref] = p
	r.order = append(r.order, p.Ref)
	return nil
}

// IsHeld reports whether a participant is on hold.
func (r *Room) isHeld() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.heldRef != ""
}

// caller is the first phone participant: the inbound caller, or the dialed party of an outbound
// call.
func (r *Room) caller() *Participant {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, ref := range r.order {
		if p := r.participants[ref]; p != nil && p.Kind == KindPhone {
			return p
		}
	}
	return nil
}

// reportDTMF publishes one keypress, dropping the same digit from a second source within the
// de-duplication window (MN8: each keypress reported once).
func (r *Room) reportDTMF(p *Participant, digit, source string) {
	p.dtmfMu.Lock()
	dup := digit == p.lastDigit && source != p.lastSource && time.Since(p.lastDigitAt) < dtmfDedupWindow
	if !dup {
		p.lastDigit, p.lastSource = digit, source
	}
	p.lastDigitAt = time.Now()
	p.dtmfMu.Unlock()
	if dup {
		return
	}
	r.node.dtmfReported.Add(1)
	r.node.emit(r.Ref, Event{"type": "dtmf", "participantRef": p.Ref, "digit": digit, "source": source})
}

// servePhone starts receiving a SIP leg's RTP, with RFC 4733 events and, when neither RFC 4733 nor
// SIP INFO is in use, in-band detection on the decoded audio.
func (r *Room) servePhone(p *Participant) {
	if p.media.DTMF < 0 {
		p.inband = &dtmf.Detector{}
	}
	for _, leg := range []any{p.leg, p.out} {
		if src, ok := leg.(DTMFSource); ok {
			src.OnDTMF(func(d string) { r.infoDTMF(p, d) })
		}
	}
	go p.endpoint.Serve(rtpio.Handlers{
		Packet: p.push,
		Skip:   p.jb.Skip,
		DTMF:   func(d string) { r.reportDTMF(p, d, SourceRFC4733) },
	})
}

// infoDTMF is a SIP INFO keypress; from then on the leg uses INFO and in-band detection stops.
func (r *Room) infoDTMF(p *Participant, digit string) {
	p.infoSeen.Store(true)
	r.reportDTMF(p, digit, SourceSIPInfo)
}

// prepareSRTP checks an offer's encryption against the node's policy and, for SAVP offers, keys
// the endpoint. It returns a SIP status on refusal.
func (r *Room) prepareSRTP(p *Participant, m sdp.Media) int {
	if !m.Secure {
		if r.node.cfg.RequireEncryption {
			return 488
		}
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

func (r *Room) addPhone(call IncomingCall) (*Participant, int, error) {
	pt, codecName, ok := call.Media.ChoosePreferred(r.node.cfg.Codecs...)
	if !ok {
		return nil, 488, fmt.Errorf("no common codec")
	}
	codec, _ := audio.CodecFor(codecName)
	ep, err := rtpio.Listen(r.node.cfg.RTPHost)
	if err != nil {
		return nil, 500, err
	}
	if err := ep.Configure(codec, pt, call.Media.DTMF, call.Media.Host, call.Media.Port); err != nil {
		ep.Close()
		return nil, 500, err
	}
	p := newParticipant(r.node.nextRef("p-caller"), KindPhone, codecName, codec, ep, pt)
	p.leg, p.media = call.Leg, call.Media
	if status := r.prepareSRTP(p, call.Media); status != 0 {
		ep.Close()
		return nil, status, fmt.Errorf("encryption mismatch")
	}
	if err := r.add(p); err != nil {
		ep.Close()
		return nil, 500, err
	}
	r.servePhone(p)
	return p, 0, nil
}

func (r *Room) ring() error {
	c := r.caller()
	if c == nil || c.leg == nil {
		return fmt.Errorf("no caller")
	}
	return c.leg.Ring()
}

// answerSDP is the node's answer for a phone participant.
func (r *Room) answerSDP(c *Participant) []byte {
	d := sdp.Description{Host: r.node.cfg.AdvertiseHost, Port: c.endpoint.Port(),
		Codecs: []sdp.Codec{{PT: c.pt, Name: c.Codec}}, DTMF: c.media.DTMF}
	if c.srtpKey != "" {
		d.Crypto = &sdp.Crypto{Tag: c.cryptoTag, Suite: rtpio.SRTPSuite, Key: c.srtpKey}
	}
	return sdp.WriteDescription(d)
}

func (r *Room) answer() error {
	c := r.caller()
	if c == nil || c.leg == nil {
		return fmt.Errorf("no caller")
	}
	c.mu.Lock()
	already := c.answered
	c.answered = true
	c.mu.Unlock()
	if already {
		return nil
	}
	return c.leg.Answer(r.answerSDP(c))
}

type replyFn func(Command) Command
type failFn func(code, message string) Command

// trackKindError refuses tracks of any kind but audio (MN1: v1 is audio only).
func trackKindError(cmd Command) string {
	if tracks, ok := cmd["tracks"].([]any); ok {
		for _, t := range tracks {
			track, _ := t.(map[string]any)
			if kind, _ := track["kind"].(string); kind != "" && kind != "audio" {
				return kind
			}
		}
	}
	if block, ok := cmd["rtp"].(map[string]any); ok {
		if kind, _ := block["kind"].(string); kind != "" && kind != "audio" {
			return kind
		}
	}
	return ""
}

func (r *Room) addSession(cmd Command, ack replyFn, fail failFn) Command {
	if kind := trackKindError(cmd); kind != "" {
		return fail("unsupported_track_kind", kind)
	}
	block := parseRTPBlock(cmd["rtp"])
	if block.host == "" || block.port == 0 || block.codec == "" {
		return fail("bad_message", "participant.add needs rtp {host, port, codec}")
	}
	codec, ok := audio.CodecFor(block.codec)
	if !ok {
		return fail("unsupported_codec", block.codec)
	}
	if block.ptime != audio.FrameMs {
		return fail("unsupported_codec", "only ptime 20 is supported")
	}
	if block.badSRTP != "" {
		return fail("bad_message", block.badSRTP)
	}
	if r.node.cfg.RequireEncryption && !block.hasSRTP {
		return fail("encryption_required", "this node requires srtp on the gateway leg")
	}
	pt := block.payloadType
	if pt < 0 {
		pt = defaultPayloadType(block.codec)
	}
	r.mu.Lock()
	full := len(r.participants) >= r.node.cfg.MaxParticipants
	r.mu.Unlock()
	if full {
		return fail("room_full", "")
	}
	ep, err := rtpio.Listen(r.node.cfg.RTPHost)
	if err != nil {
		return fail("internal", err.Error())
	}
	if err := ep.Configure(codec, pt, -1, block.host, block.port); err != nil {
		ep.Close()
		return fail("bad_message", err.Error())
	}
	p := newParticipant(r.node.nextRef("p-session"), KindSession, block.codec, codec, ep, pt)
	if block.srtpKey != "" {
		p.srtpKey = rtpio.NewSRTPKey()
		if err := ep.SetSRTP(p.srtpKey, block.srtpKey); err != nil {
			ep.Close()
			return fail("bad_message", err.Error())
		}
	}
	if err := r.add(p); err != nil {
		ep.Close()
		if err == errRoomFull {
			return fail("room_full", "")
		}
		return fail("room_not_found", err.Error())
	}
	go ep.Serve(rtpio.Handlers{Packet: p.push})
	id, _ := cmd["id"].(string)
	r.node.emit(r.Ref, Event{"type": "participant.joined", "id": id, "participantRef": p.Ref, "tracks": p.tracks()})
	reply := Command{
		"host": r.node.cfg.AdvertiseHost, "port": ep.Port(), "codec": block.codec,
		"payloadType": pt, "ptime": block.ptime, "ssrc": ep.SSRC,
	}
	if p.srtpKey != "" {
		reply["srtp"] = Command{"suite": rtpio.SRTPSuite, "key": p.srtpKey}
	}
	return ack(Command{"participantRef": p.Ref, "rtp": reply})
}

// retire closes a participant's endpoint and keeps its counters for the node's totals.
func (r *Room) retire(p *Participant) {
	p.endpoint.Close()
	if p.jb != nil {
		st := p.jb.Stats()
		r.mu.Lock()
		r.goneStats = r.goneStats.Add(st)
		r.mu.Unlock()
	}
}

// remove takes a participant out; a phone participant also gets a BYE.
func (r *Room) remove(ref, id, reason string) bool {
	r.mu.Lock()
	p := r.participants[ref]
	if p == nil {
		r.mu.Unlock()
		return false
	}
	delete(r.participants, ref)
	for i, o := range r.order {
		if o == ref {
			r.order = append(r.order[:i], r.order[i+1:]...)
			break
		}
	}
	r.mu.Unlock()
	remoteLeft := reason == ReasonCallerHangup || reason == ReasonCalleeHangup
	if p.Kind == KindPhone && !remoteLeft {
		if p.leg != nil {
			_ = p.leg.Bye()
		}
		if p.out != nil {
			_ = p.out.Bye()
		}
	}
	r.retire(p)
	ev := Event{"type": "participant.left", "participantRef": p.Ref, "reason": reason}
	if id != "" {
		ev["id"] = id
	}
	r.node.emit(r.Ref, ev)
	r.mu.Lock()
	remaining := len(r.participants)
	r.mu.Unlock()
	if p.Kind == KindPhone && (r.caller() == nil || remaining == 1) {
		// No phone party left, or one left alone: the call is over (BYE to whoever remains).
		r.hangupAll(reason, 0, id)
	}
	return true
}

func (r *Room) callerHungUp() {
	if c := r.caller(); c != nil {
		r.remove(c.Ref, "", ReasonCallerHangup)
	} else {
		r.end(ReasonCallerHangup, 0, "")
	}
}

// hangupAll ends the call: an unanswered caller gets the status (or 480), an answered one a BYE.
func (r *Room) hangupAll(reason string, status int, id string) {
	r.mu.Lock()
	phones := []*Participant{}
	for _, ref := range r.order {
		if p := r.participants[ref]; p != nil && p.Kind == KindPhone {
			phones = append(phones, p)
		}
	}
	r.mu.Unlock()
	for _, c := range phones {
		if c.out != nil {
			_ = c.out.Bye()
			continue
		}
		c.mu.Lock()
		answered := c.answered
		c.mu.Unlock()
		if !answered {
			if status == 0 {
				status = 480
			}
			_ = c.leg.Reject(status)
		} else {
			_ = c.leg.Bye()
		}
	}
	r.end(reason, status, id)
}

// end closes every participant and reports room.ended once.
func (r *Room) end(reason string, status int, id string) {
	r.mu.Lock()
	if r.ended {
		r.mu.Unlock()
		return
	}
	r.ended = true
	parts := make([]*Participant, 0, len(r.participants))
	for _, p := range r.participants {
		parts = append(parts, p)
	}
	r.participants = map[string]*Participant{}
	r.order = nil
	listeners := r.listeners
	r.listeners = nil
	var stopped []string
	for _, pb := range r.plays {
		stopped = append(stopped, pb.ref)
	}
	r.plays = nil
	r.mu.Unlock()
	close(r.done)
	r.playsDone(stopped, OpStopped)
	for _, p := range parts {
		r.retire(p)
	}
	for _, fs := range listeners {
		for _, f := range fs {
			f.endpoint.Close()
		}
	}
	ev := Event{"type": "room.ended", "reason": reason}
	if status != 0 {
		ev["sipStatus"] = status
	}
	if id != "" {
		ev["id"] = id
	}
	r.node.emit(r.Ref, ev)
	r.node.roomEnded(r)
}

// setHold cuts the caller off from the others and plays music (or silence) to them (MN17).
func (r *Room) setHold(held bool, musicURL string) {
	ref := ""
	if c := r.caller(); held && c != nil {
		ref = c.Ref
	}
	r.mu.Lock()
	r.heldRef = ref
	r.music, r.musicPos = nil, 0
	r.mu.Unlock()
	if held && musicURL != "" {
		go func() {
			frames, err := r.node.fetchWav(musicURL)
			if err != nil {
				r.node.cfg.Logger.Warn("hold music", "url", musicURL, "err", err)
				return
			}
			r.mu.Lock()
			if r.heldRef != "" {
				r.music = frames
			}
			r.mu.Unlock()
		}()
	}
}

func (r *Room) sendDTMF(digits string) {
	if c := r.caller(); c != nil {
		sendDTMFOn(c, digits)
	}
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
			r.node.missedTicks.Add(uint64(due - maxCatchUp))
			next = next.Add(time.Duration(due-maxCatchUp) * period)
			due = maxCatchUp
		}
		if due > 1 {
			r.node.lateTicks.Add(uint64(due - 1))
		}
		for i := 0; i < due; i++ {
			r.tick()
			next = next.Add(period)
			if ticks++; ticks%50 == 0 {
				r.checkLimits()
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
	heldRef := r.heldRef
	var musicFrame audio.Frame
	if heldRef != "" && len(r.music) > 0 {
		musicFrame = r.music[r.musicPos%len(r.music)]
		r.musicPos++
	}
	plays, playsDone := r.nextPlayFrames()
	r.mu.Unlock()
	r.playsDone(playsDone, OpCompleted)

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
	r.mu.Lock()
	var forks []fork
	for _, fs := range r.listeners {
		forks = append(forks, fs...)
	}
	r.mu.Unlock()
	for _, f := range forks {
		frame := byTrack[f.trackID]
		if frame == nil {
			frame = audio.Silence()
		}
		f.endpoint.Send(frame)
	}
	for i, p := range parts {
		if p.Ref == heldRef {
			out := musicFrame
			if out == nil {
				out = audio.Silence()
			}
			p.endpoint.Send(out)
			continue
		}
		others := make([]audio.Frame, 0, len(parts))
		for j, q := range parts {
			if i == j || q.Ref == heldRef {
				continue
			}
			others = append(others, frames[j])
		}
		others = playsFor(p.Ref, plays, others)
		p.endpoint.Send(audio.Mix(others...))
	}
	r.node.framesMixed.Add(uint64(len(parts)))
}

func (r *Room) checkLimits() {
	r.mu.Lock()
	limit := r.maxDuration
	r.mu.Unlock()
	if time.Since(r.created) > limit {
		r.hangupAll(ReasonMaxDuration, 0, "")
		return
	}
	if why := r.orphaned(); why != "" {
		r.node.cfg.Logger.Warn("ending a room without an owner", "room", r.Ref, "why", why)
		r.hangupAll(ReasonNodeError, 0, "")
		return
	}
	c := r.caller()
	if c == nil {
		return
	}
	c.mu.Lock()
	answered := c.answered
	c.mu.Unlock()
	if answered && time.Since(c.endpoint.LastPacketAt()) > r.node.cfg.MediaTimeout {
		r.hangupAll(ReasonMediaTimeout, 0, "")
	}
}

// setMaxDuration lowers the room's limit (an app's maxDurationSec); it never raises it.
func (r *Room) setMaxDuration(cmd Command) {
	sec, ok := cmd["maxDurationSec"].(float64)
	if !ok || sec <= 0 {
		return
	}
	d := time.Duration(sec * float64(time.Second))
	r.mu.Lock()
	if d < r.maxDuration {
		r.maxDuration = d
	}
	r.mu.Unlock()
}

// jitterStats sums the room's jitter buffers, including participants that left.
func (r *Room) jitterStats() jitter.Stats {
	r.mu.Lock()
	defer r.mu.Unlock()
	total := r.goneStats
	for _, p := range r.participants {
		if p.jb != nil {
			total = total.Add(p.jb.Stats())
		}
	}
	return total
}

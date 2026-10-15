package node

import (
	"encoding/binary"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/fonoster/fonoster/go/medianode/internal/rtpio"
	"github.com/fonoster/fonoster/go/medianode/internal/sdp"
)

// Kinds of participants.
const (
	KindPhone   = "phone"
	KindSession = "session"
)

// inboxFrames bounds what a participant may queue ahead of the mixer (jitter slack).
const inboxFrames = 4

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

	mu    sync.Mutex
	inbox []audio.Frame
}

func (p *Participant) tracks() []Event {
	return []Event{{"trackId": p.TrackID, "kind": "audio", "codec": p.Codec, "direction": "sendrecv"}}
}

func (p *Participant) push(f audio.Frame) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if len(p.inbox) >= inboxFrames {
		p.inbox = p.inbox[1:]
	}
	p.inbox = append(p.inbox, f)
}

func (p *Participant) pull() audio.Frame {
	p.mu.Lock()
	defer p.mu.Unlock()
	if len(p.inbox) == 0 {
		return nil
	}
	f := p.inbox[0]
	p.inbox = p.inbox[1:]
	return f
}

// Room mixes audio so each participant hears everyone but themselves (mix-minus).
type Room struct {
	Ref     string
	node    *Node
	created time.Time

	mu           sync.Mutex
	participants map[string]*Participant
	order        []string
	nextTrack    int
	heldRef      string // the participant on hold, if any
	music        []audio.Frame
	musicPos     int
	ended        bool
	done         chan struct{}
}

func newRoom(n *Node, ref string) *Room {
	return &Room{Ref: ref, node: n, created: time.Now(), participants: map[string]*Participant{}, done: make(chan struct{})}
}

func (r *Room) add(p *Participant) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.ended {
		return fmt.Errorf("room ended")
	}
	if len(r.participants) >= r.node.cfg.MaxParticipants {
		return fmt.Errorf("room_full")
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

func (r *Room) addPhone(call IncomingCall) (*Participant, error) {
	pt, codecName, _ := call.Media.Choose("PCMU/8000")
	codec, _ := audio.CodecFor(codecName)
	ep, err := rtpio.Listen(r.node.cfg.RTPHost)
	if err != nil {
		return nil, err
	}
	if err := ep.Configure(codec, pt, call.Media.DTMF, call.Media.Host, call.Media.Port); err != nil {
		ep.Close()
		return nil, err
	}
	p := &Participant{Ref: r.node.nextRef("p-caller"), Kind: KindPhone, Codec: codecName, endpoint: ep,
		leg: call.Leg, media: call.Media, pt: pt}
	if err := r.add(p); err != nil {
		ep.Close()
		return nil, err
	}
	go ep.Serve(rtpio.Handlers{
		Audio: p.push,
		DTMF: func(d string) {
			r.node.emit(r.Ref, Event{"type": "dtmf", "participantRef": p.Ref, "digit": d, "source": "rfc4733"})
		},
	})
	return p, nil
}

func (r *Room) ring() error {
	c := r.caller()
	if c == nil {
		return fmt.Errorf("no caller")
	}
	return c.leg.Ring()
}

func (r *Room) answer() error {
	c := r.caller()
	if c == nil {
		return fmt.Errorf("no caller")
	}
	c.mu.Lock()
	already := c.answered
	c.answered = true
	c.mu.Unlock()
	if already {
		return nil
	}
	body := sdp.Write(r.node.cfg.AdvertiseHost, c.endpoint.Port(), c.pt, c.Codec, c.media.DTMF)
	return c.leg.Answer(body)
}

type replyFn func(Command) Command
type failFn func(code, message string) Command

func (r *Room) addSession(cmd Command, ack replyFn, fail failFn) Command {
	block, _ := cmd["rtp"].(map[string]any)
	host, _ := block["host"].(string)
	port, _ := block["port"].(float64)
	codecName, _ := block["codec"].(string)
	if host == "" || port == 0 || codecName == "" {
		return fail("bad_message", "participant.add needs rtp {host, port, codec}")
	}
	codec, ok := audio.CodecFor(codecName)
	if !ok {
		return fail("unsupported_codec", codecName)
	}
	pt := 96
	if codecName == "PCMU/8000" {
		pt = 0
	}
	if v, ok := block["payloadType"].(float64); ok {
		pt = int(v)
	}
	ptime := 20
	if v, ok := block["ptime"].(float64); ok {
		ptime = int(v)
	}
	if ptime != audio.FrameMs {
		return fail("unsupported_codec", "only ptime 20 is supported")
	}
	ep, err := rtpio.Listen(r.node.cfg.RTPHost)
	if err != nil {
		return fail("internal", err.Error())
	}
	if err := ep.Configure(codec, pt, -1, host, int(port)); err != nil {
		ep.Close()
		return fail("bad_message", err.Error())
	}
	p := &Participant{Ref: r.node.nextRef("p-session"), Kind: KindSession, Codec: codecName, endpoint: ep, pt: pt}
	if err := r.add(p); err != nil {
		ep.Close()
		return fail("room_full", err.Error())
	}
	go ep.Serve(rtpio.Handlers{Audio: p.push})
	id, _ := cmd["id"].(string)
	r.node.emit(r.Ref, Event{"type": "participant.joined", "id": id, "participantRef": p.Ref, "tracks": p.tracks()})
	return ack(Command{
		"participantRef": p.Ref,
		"rtp": Command{
			"host": r.node.cfg.AdvertiseHost, "port": ep.Port(), "codec": codecName,
			"payloadType": pt, "ptime": ptime, "ssrc": ep.SSRC,
		},
	})
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
	p.endpoint.Close()
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
	r.mu.Unlock()
	close(r.done)
	for _, p := range parts {
		p.endpoint.Close()
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
			frames, err := fetchWav(musicURL)
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
	c := r.caller()
	if c == nil || c.media.DTMF < 0 {
		return
	}
	for _, d := range digits {
		c.endpoint.SendDTMF(d, c.media.DTMF)
	}
}

// run is the room's clock: every 20 ms each participant gets the mix of the others.
func (r *Room) run() {
	t := time.NewTicker(audio.FrameMs * time.Millisecond)
	defer t.Stop()
	checks := 0
	for {
		select {
		case <-r.done:
			return
		case <-t.C:
		}
		r.tick()
		if checks++; checks%50 == 0 {
			r.checkLimits()
		}
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
	r.mu.Unlock()

	frames := make([]audio.Frame, len(parts))
	for i, p := range parts {
		frames[i] = p.pull()
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
		p.endpoint.Send(audio.Mix(others...))
	}
}

func (r *Room) checkLimits() {
	if time.Since(r.created) > r.node.cfg.MaxDuration {
		r.hangupAll(ReasonMaxDuration, 0, "")
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

// fetchWav reads a PCM16 WAV (8 or 16 kHz, mono) into internal frames.
func fetchWav(url string) ([]audio.Frame, error) {
	res, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", res.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, 20<<20))
	if err != nil {
		return nil, err
	}
	if len(data) < 44 || string(data[0:4]) != "RIFF" || string(data[8:12]) != "WAVE" {
		return nil, fmt.Errorf("not a WAV file")
	}
	var rate, bits, channels int
	var pcm []byte
	for off := 12; off+8 <= len(data); {
		id := string(data[off : off+4])
		size := int(binary.LittleEndian.Uint32(data[off+4:]))
		body := data[off+8 : min(len(data), off+8+size)]
		switch id {
		case "fmt ":
			if len(body) >= 16 {
				channels = int(binary.LittleEndian.Uint16(body[2:]))
				rate = int(binary.LittleEndian.Uint32(body[4:]))
				bits = int(binary.LittleEndian.Uint16(body[14:]))
			}
		case "data":
			pcm = body
		}
		off += 8 + size + size%2
	}
	if bits != 16 || channels != 1 || (rate != 8000 && rate != 16000) {
		return nil, fmt.Errorf("need mono 16-bit PCM at 8 or 16 kHz")
	}
	samples := make([]int16, len(pcm)/2)
	for i := range samples {
		samples[i] = int16(binary.LittleEndian.Uint16(pcm[i*2:]))
	}
	var wide []int16 = samples
	if rate == 8000 {
		wide = audio.Upsample2(samples)
	}
	var frames []audio.Frame
	for i := 0; i+audio.FrameSamples <= len(wide); i += audio.FrameSamples {
		frames = append(frames, audio.Frame(wide[i:i+audio.FrameSamples]))
	}
	return frames, nil
}

package node

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// WarmTransferTimeout is how long a warm transfer's new party has to answer (MN17).
var WarmTransferTimeout = 30 * time.Second

// dialTimeout bounds a plain participant.dial or cold transfer.
const dialTimeout = 60 * time.Second

// progressStatus maps a failed dial's SIP status to media-control's call.progress status.
func progressStatus(status int) string {
	switch status {
	case 486, 600:
		return "busy"
	case 408, 480, 487:
		return "no_answer"
	default:
		return "failed"
	}
}

// dialParty dials `to` through the node's Dialer and, when answered, adds it to the room.
// onProgress gets "ringing"; the result is the new participant or a *DialError.
func (r *Room) dialParty(ctx context.Context, to, from string, headers map[string]string,
	onRinging func()) (*Participant, error) {
	dialer := r.node.dialer
	if dialer == nil {
		return nil, fmt.Errorf("no outbound proxy configured")
	}
	return r.dialLeg(func(offer []byte, onProgress func(int)) (OutLeg, []byte, error) {
		return dialer.Dial(ctx, to, from, headers, offer, onProgress)
	}, onRinging)
}

// dialFunc sends the INVITE with the node's offer and waits for the answer.
type dialFunc func(offer []byte, onProgress func(status int)) (OutLeg, []byte, error)

// dialLeg offers the node's codecs through dial and, when answered, adds the party to the room
// (participant.dial, transfers and Roomr's CreateCall).
func (r *Room) dialLeg(dial dialFunc, onRinging func()) (*Participant, error) {
	ep, err := rtpio.Listen(r.node.cfg.RTPHost)
	if err != nil {
		return nil, err
	}
	offer := sdp.Description{Host: r.node.cfg.AdvertiseHost, Port: ep.Port(), DTMF: 101}
	for _, name := range r.node.cfg.Codecs {
		pt := audio.StaticPayloadType(name)
		if pt < 0 {
			pt = 111
		}
		offer.Codecs = append(offer.Codecs, sdp.Codec{PT: pt, Name: name})
	}
	localKey := ""
	if r.node.cfg.RequireEncryption {
		localKey = rtpio.NewSRTPKey()
		offer.Crypto = &sdp.Crypto{Tag: 1, Suite: rtpio.SRTPSuite, Key: localKey}
	}
	ringing := false
	leg, answer, err := dial(sdp.WriteDescription(offer), func(status int) {
		if (status == 180 || status == 183) && !ringing {
			ringing = true
			onRinging()
		}
	})
	if err != nil {
		ep.Close()
		return nil, err
	}
	media, err := sdp.Parse(answer)
	if err != nil {
		_ = leg.Bye()
		ep.Close()
		return nil, err
	}
	pt, codecName, ok := media.Choose(r.node.cfg.Codecs...)
	if !ok {
		_ = leg.Bye()
		ep.Close()
		return nil, &DialError{Status: 488}
	}
	codec, _ := audio.CodecFor(codecName)
	if err := ep.Configure(codec, pt, media.DTMF, media.Host, media.Port); err != nil {
		_ = leg.Bye()
		ep.Close()
		return nil, err
	}
	if localKey != "" {
		remote := ""
		for _, c := range media.Crypto {
			if c.Suite == rtpio.SRTPSuite {
				remote = c.Key
			}
		}
		if !media.Secure || remote == "" || ep.SetSRTP(localKey, remote) != nil {
			_ = leg.Bye()
			ep.Close()
			return nil, &DialError{Status: 488}
		}
	}
	p := newParticipant(r.node.nextRef("p-dialed"), KindPhone, codecName, codec, ep, pt)
	p.out, p.media, p.answered, p.srtpKey = leg, media, true, localKey
	if err := r.add(p); err != nil {
		_ = leg.Bye()
		ep.Close()
		return nil, err
	}
	r.servePhone(p)
	go func() {
		<-leg.Gone()
		r.remove(p.Ref, "", ReasonCalleeHangup)
	}()
	return p, nil
}

// dialEndReason is the room.ended reason of a failed dial's call.progress status.
func dialEndReason(progress string) string {
	switch progress {
	case "busy", "no_answer":
		return progress
	default:
		return ReasonRejected
	}
}

func dialStatus(err error) int {
	var de *DialError
	if errors.As(err, &de) {
		return de.Status
	}
	return 503
}

func stringMap(v any) map[string]string {
	out := map[string]string{}
	if m, ok := v.(map[string]any); ok {
		for k, val := range m {
			if s, ok := val.(string); ok {
				out[k] = s
			}
		}
	}
	return out
}

// dial is participant.dial: progress events, then call.answered and participant.joined.
func (r *Room) dial(cmd Command) {
	id, _ := cmd["id"].(string)
	to, _ := cmd["to"].(string)
	from, _ := cmd["from"].(string)
	ctx, cancel := context.WithTimeout(context.Background(), dialTimeout)
	defer cancel()
	r.dialStarted()
	r.node.emit(r.Ref, Event{"type": "call.progress", "id": id, "status": "ringing"})
	p, err := r.dialParty(ctx, to, from, stringMap(cmd["headers"]), func() {})
	empty := r.dialEnded()
	if err != nil {
		status := dialStatus(err)
		r.node.cfg.Logger.Warn("dial failed", "room", r.Ref, "to", to, "err", err)
		progress := progressStatus(status)
		r.node.emit(r.Ref, Event{"type": "call.progress", "id": id, "status": progress, "sipStatus": status})
		if empty {
			// Nobody else is in the room (an API-originated call): the call is over.
			r.end(dialEndReason(progress), status, "")
		}
		return
	}
	r.node.emit(r.Ref, Event{"type": "call.answered", "id": id, "participantRef": p.Ref})
	r.node.emit(r.Ref, Event{"type": "participant.joined", "id": id, "participantRef": p.Ref, "tracks": p.tracks()})
}

func (r *Room) session() *Participant {
	r.mu.Lock()
	defer r.mu.Unlock()
	for _, ref := range r.order {
		if p := r.participants[ref]; p != nil && p.Kind == KindSession {
			return p
		}
	}
	return nil
}

// transfer runs cold, warm and refer transfers (media-control, "Transfer modes").
func (r *Room) transfer(cmd Command) {
	id, _ := cmd["id"].(string)
	to, _ := cmd["to"].(string)
	mode, _ := cmd["mode"].(string)
	music, _ := cmd["music"].(string)
	result := func(status string, extra Event) {
		ev := Event{"type": "transfer.result", "id": id, "status": status}
		for k, v := range extra {
			ev[k] = v
		}
		r.node.emit(r.Ref, ev)
	}
	switch mode {
	case "refer":
		c := r.caller()
		var ref Referrer
		ok := false
		if c != nil && c.leg != nil {
			ref, ok = c.leg.(Referrer)
		}
		if !ok {
			result("failed", Event{"reason": "refer_unsupported"})
			return
		}
		if err := ref.Refer(to); err != nil {
			result("failed", Event{"reason": err.Error()})
			return
		}
		result("referred", nil)
		r.hangupAll(ReasonRemoved, 0, id)
		return
	case "warm":
		r.setHold(true, music)
	default:
		mode = "cold"
	}
	timeout := dialTimeout
	if mode == "warm" {
		timeout = WarmTransferTimeout
	}
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()
	p, err := r.dialParty(ctx, to, "", stringMap(cmd["headers"]), func() {})
	if err != nil {
		if mode == "warm" {
			r.setHold(false, "")
		}
		result("failed", Event{"reason": progressStatus(dialStatus(err)), "sipStatus": dialStatus(err)})
		return
	}
	r.node.emit(r.Ref, Event{"type": "participant.joined", "id": id, "participantRef": p.Ref, "tracks": p.tracks()})
	if mode == "warm" {
		return // the app briefs the new party; transfer.complete finishes it
	}
	if s := r.session(); s != nil {
		r.remove(s.Ref, id, ReasonRemoved)
	}
	result("completed", nil)
}

// completeTransfer is transfer.complete: the caller meets the new party, the session leaves.
func (r *Room) completeTransfer(id string) {
	r.setHold(false, "")
	if s := r.session(); s != nil {
		r.remove(s.Ref, "", ReasonRemoved)
	}
	r.node.emit(r.Ref, Event{"type": "transfer.result", "id": id, "status": "completed"})
}

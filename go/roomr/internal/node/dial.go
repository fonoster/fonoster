package node

import (
	"context"
	"errors"

	sessionv1 "github.com/fonoster/fonoster/go/roomr/api/session/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/rtpio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// failCause is a failed dial's ending cause from its final SIP status.
func failCause(status int) string {
	switch status {
	case 486, 600:
		return ReasonBusy
	case 408, 480, 487:
		return ReasonNoAnswer
	default:
		return ReasonRejected
	}
}

// dialStatus is a failed dial's SIP status (503 when no response said otherwise).
func dialStatus(err error) int {
	var de *DialError
	if errors.As(err, &de) {
		return de.Status
	}
	return 503
}

// offer is the node's SDP offer on its own INVITEs: the configured codecs in order
// (opus/48000/2, G722/8000, PCMU/8000, PCMA/8000 by default) and telephone-event.
func (n *Node) offer(port int) []byte {
	d := sdp.Description{Host: n.cfg.AdvertiseHost, Port: port, DTMF: 101}
	for _, name := range n.cfg.Codecs {
		pt := audio.StaticPayloadType(name)
		if pt < 0 {
			pt = 111
		}
		d.Codecs = append(d.Codecs, sdp.Codec{PT: pt, Name: name})
	}
	return sdp.WriteDescription(d)
}

// dialOut sends an INVITE for t (through t.Proxy, else the node's outbound proxy) with the
// node's offer and returns the answered party as a participant, not yet in any room, or a
// *DialError with the final status.
func (n *Node) dialOut(ctx context.Context, t SipTarget, from string, onProgress func(status int)) (*Participant, error) {
	dialer := n.targetDialer()
	if dialer == nil {
		return nil, errorf(CodeNotSupported, "this node has no SIP user agent")
	}
	if t.Proxy == "" {
		t.Proxy = n.cfg.OutboundProxy
	}
	if onProgress == nil {
		onProgress = func(int) {}
	}
	ep, err := rtpio.Listen(n.cfg.RTPHost)
	if err != nil {
		return nil, err
	}
	leg, answer, err := dialer.DialTarget(ctx, t, from, n.offer(ep.Port()), onProgress)
	if err != nil {
		ep.Close()
		return nil, err
	}
	media, err := sdp.Parse(answer)
	if err != nil {
		_ = leg.Bye()
		ep.Close()
		return nil, &DialError{Status: 488}
	}
	pt, codecName, ok := media.Choose(n.cfg.Codecs...)
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
	p := newParticipant(newRef("p-dialed"), KindPhone, codecName, codec, ep, pt)
	p.out = leg
	p.setMedia(media)
	p.answered.Store(true)
	return p, nil
}

// joinParty adds a dialed party to the call's room; it hangs the party up when the room
// refuses it.
func (c *call) joinParty(room *Room, p *Participant) error {
	p.call = c
	if err := room.add(p); err != nil {
		_ = p.out.Bye()
		p.endpoint.Close()
		return err
	}
	room.servePhone(p)
	go func() {
		select {
		case <-p.out.Gone():
			room.remove(p.Ref, ReasonCalleeHangup)
		case <-room.done:
		}
	}()
	return nil
}

// target converts a SipTarget from the control stream.
func target(t *sessionv1.SipTarget) SipTarget {
	return SipTarget{URI: t.GetUri(), Proxy: t.GetProxy(), Headers: t.GetHeaders(),
		Username: t.GetAuth().GetUsername(), Password: t.GetAuth().GetPassword()}
}

// transfer runs the app's Transfer (media-control "Transfer modes"): cold and warm dial the
// target into the call's room (cold removes the app's leg once the new party joins; warm holds
// the caller and keeps the app until TransferComplete); refer sends a SIP REFER on the
// caller's leg and leaves the call once it is accepted. The outcome is a TransferResult.
func (c *call) transfer(t *sessionv1.Transfer) {
	c.mu.Lock()
	room, leg := c.room, c.leg
	c.mu.Unlock()
	to := target(t.GetTo())
	mode := t.GetMode()
	if mode == "refer" {
		go func() {
			ref, ok := leg.leg.(Referrer)
			if leg.leg == nil || !ok {
				c.streamTransferResult("failed", ReasonRejected, 0)
				return
			}
			if err := ref.Refer(to.URI); err != nil {
				c.n.cfg.Logger.Warn("refer", "callRef", c.ref, "err", err)
				c.streamTransferResult("failed", ReasonRejected, 0)
				return
			}
			c.streamTransferResult("referred", "", 0)
			c.end(ReasonRemoved, 0)
		}()
		return
	}
	if err := to.check(); err != nil {
		c.streamTransferResult("failed", ReasonRejected, 0)
		return
	}
	warm := mode == "warm"
	timeout := dialTimeout
	if warm {
		timeout = WarmTransferTimeout
	}
	if s := t.GetRingTimeoutS(); s > 0 && seconds(s) < timeout {
		timeout = seconds(s)
	}
	if warm {
		room.setHold(leg, true, t.GetMusic())
	}
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), timeout)
		defer cancel()
		go func() {
			select {
			case <-c.done:
				cancel()
			case <-ctx.Done():
			}
		}()
		p, err := c.n.dialOut(ctx, to, "", nil)
		if err == nil {
			err = c.joinParty(room, p)
		}
		if err != nil {
			if warm {
				room.setHold(leg, false, "")
			}
			status := dialStatus(err)
			c.streamTransferResult("failed", failCause(status), status)
			return
		}
		c.mu.Lock()
		if c.ending {
			c.mu.Unlock()
			room.remove(p.Ref, ReasonRemoved)
			return
		}
		c.parties = append(c.parties, p)
		if warm {
			c.warm = p
		}
		app := c.app
		c.mu.Unlock()
		room.participantEvent(p, "participant.joined", "")
		if warm {
			return // the app briefs the new party; TransferComplete finishes it
		}
		c.mu.Lock()
		c.transferred = true
		c.mu.Unlock()
		if app != nil {
			room.remove(app.Ref, ReasonRemoved)
		}
		c.streamTransferResult("completed", "", 0)
	}()
}

// completeTransfer is TransferComplete: the caller is resumed and meets the new party, the
// app's leg leaves.
func (c *call) completeTransfer() {
	c.mu.Lock()
	room, leg, app, warm := c.room, c.leg, c.app, c.warm
	c.warm = nil
	if warm != nil {
		c.transferred = true
	}
	c.mu.Unlock()
	if warm == nil {
		c.streamTransferResult("failed", ReasonRejected, 0)
		return
	}
	room.setHold(leg, false, "")
	c.streamTransferResult("completed", "", 0)
	if app != nil {
		room.remove(app.Ref, ReasonRemoved)
	}
}

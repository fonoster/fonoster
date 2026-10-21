package caller

// The bot as a fake SIP trunk and registrar (redesign-roomr conformance 11.9, 11.10): as the
// node's outbound proxy it records every INVITE it receives (Request-URI and X- headers, answered
// or not) and answers 200, 486, 480, 603, a 401 or 407 digest challenge, or nothing, on cue; as
// a registrar it records every REGISTER (Expires and X- headers) and can require digest auth.

import (
	"strconv"
	"strings"
	"time"

	"github.com/emiago/sipgo/sip"
)

// InviteSeen is one INVITE the bot received as a callee.
type InviteSeen struct {
	RequestURI string            `json:"requestUri"`
	From       string            `json:"from,omitempty"`
	Headers    map[string]string `json:"headers"`
	// Authorized: the INVITE carried credentials (Authorization or Proxy-Authorization).
	Authorized bool  `json:"authorized"`
	At         int64 `json:"at"`
}

// RegisterSeen is one REGISTER the bot accepted (or challenged, Challenged true).
type RegisterSeen struct {
	Expires    string            `json:"expires"`
	From       string            `json:"from,omitempty"`
	Contact    string            `json:"contact,omitempty"`
	Headers    map[string]string `json:"headers"`
	Challenged bool              `json:"challenged,omitempty"`
	At         int64             `json:"at"`
}

func xHeaders(req *sip.Request) map[string]string {
	out := map[string]string{}
	for _, h := range req.Headers() {
		if strings.HasPrefix(strings.ToLower(h.Name()), "x-") {
			out[h.Name()] = h.Value()
		}
	}
	return out
}

// recordInviteLocked keeps the INVITE's Request-URI and headers (b.mu held).
func (b *Bot) recordInviteLocked(req *sip.Request) {
	seen := InviteSeen{RequestURI: req.Recipient.String(), Headers: xHeaders(req), At: time.Now().UnixMilli(),
		Authorized: req.GetHeader("Authorization") != nil || req.GetHeader("Proxy-Authorization") != nil}
	if f := req.From(); f != nil {
		seen.From = f.Address.String()
	}
	b.invites = append(b.invites, seen)
}

// Invites lists every INVITE the bot received as a callee, in order.
func (b *Bot) Invites() []InviteSeen {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]InviteSeen(nil), b.invites...)
}

// ChallengeWith sets the status of the bot's INVITE challenge: 401 (default) or 407, as a proxy.
func (b *Bot) ChallengeWith(status int) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.challengeStatus = status
}

// RequireRegisterAuth makes the registrar challenge REGISTERs until they carry a valid digest
// for user and pass (an empty pass turns it off).
func (b *Bot) RequireRegisterAuth(user, pass string) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.regUser, b.regPass = user, pass
}

// Registers lists every REGISTER the registrar received, in order; RegisterChallenged counts the
// challenges it sent.
func (b *Bot) Registers() []RegisterSeen {
	b.mu.Lock()
	defer b.mu.Unlock()
	return append([]RegisterSeen(nil), b.registers...)
}

func (b *Bot) RegisterChallenged() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.regChallenged
}

func (b *Bot) onRegister(req *sip.Request, tx sip.ServerTransaction) {
	seen := RegisterSeen{Headers: xHeaders(req), At: time.Now().UnixMilli()}
	if h := req.GetHeader("Expires"); h != nil {
		seen.Expires = h.Value()
	}
	if f := req.From(); f != nil {
		seen.From = f.Address.String()
	}
	if c := req.Contact(); c != nil {
		seen.Contact = c.Address.String()
		if e, ok := c.Params.Get("expires"); ok && seen.Expires == "" {
			seen.Expires = e
		}
	}
	b.mu.Lock()
	user, pass := b.regUser, b.regPass
	if pass != "" && !authorized(req, user, pass) {
		b.regChallenged++
		seen.Challenged = true
		b.registers = append(b.registers, seen)
		b.mu.Unlock()
		challenge(req, tx, 401)
		return
	}
	b.registers = append(b.registers, seen)
	b.mu.Unlock()
	res := sip.NewResponseFromRequest(req, 200, "OK", nil)
	if c := req.Contact(); c != nil {
		res.AppendHeader(c.Clone())
	}
	if seen.Expires != "" {
		if _, err := strconv.Atoi(seen.Expires); err == nil {
			res.AppendHeader(sip.NewHeader("Expires", seen.Expires))
		}
	}
	_ = tx.Respond(res)
}

// Mute stops (true) or restarts (false) the call's RTP: a muted leg sends nothing at all.
func (c *Call) Mute(muted bool) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.muted = muted
}

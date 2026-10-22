// Package node is the Roomr node: rooms that mix audio for their participants, fed by SIP legs
// and RTP endpoints, controlled by its controller over Roomr (gRPC, internal/control) and, per
// call, by the app over one control stream to the session endpoint (redesign-roomr).
package node

import (
	"context"
	"strconv"

	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// Context is the standard context (aliased to keep signatures short).
type Context = context.Context

// Event is one event published on NATS (JSON).
type Event map[string]any

// Ending causes (media-control, "Endings carry a reason").
const (
	ReasonCallerHangup = "caller_hangup"
	ReasonCalleeHangup = "callee_hangup"
	ReasonBusy         = "busy"
	ReasonNoAnswer     = "no_answer"
	ReasonRejected     = "rejected"
	ReasonMediaTimeout = "media_timeout"
	ReasonNodeError    = "node_error"
	ReasonMaxDuration  = "max_duration"
	ReasonRemoved      = "removed"
	ReasonAppGone      = "app_gone"
)

// CallLeg is the SIP side of an inbound caller.
type CallLeg interface {
	// Ring sends 180 without early media.
	Ring() error
	// Answer sends 200 OK with the node's SDP.
	Answer(sdp []byte) error
	// Reject answers an unanswered INVITE with a final status.
	Reject(status int) error
	// Bye ends an answered call.
	Bye() error
	// Gone closes when the dialog ends: a CANCEL before the answer, a BYE after it, or the
	// node's own final response or BYE.
	Gone() <-chan struct{}
}

// IncomingCall is an INVITE, already parsed.
type IncomingCall struct {
	From, To, CallerName string
	// Headers are every header of the INVITE, as received (repeated names joined with ", ").
	Headers map[string]string
	Media   sdp.Media
	Leg     CallLeg
}

// DialError is a dial that ended without an answer.
type DialError struct{ Status int }

func (e *DialError) Error() string { return "dial failed with " + strconv.Itoa(e.Status) }

// OutLeg is an answered outbound SIP leg.
type OutLeg interface {
	Bye() error
	// Gone closes when the remote party hangs up.
	Gone() <-chan struct{}
}

// SipTarget is where a dial goes: the Request-URI, the proxy the INVITE is sent to (empty: the
// node's outbound proxy, else the Request-URI's host), headers added untouched and optional
// digest credentials (never logged or echoed).
type SipTarget struct {
	URI, Proxy         string
	Headers            map[string]string
	Username, Password string
}

// TargetDialer places outbound legs (sipua.UA). It returns the answered leg and the answer SDP,
// or a *DialError with the final status.
type TargetDialer interface {
	DialTarget(ctx Context, t SipTarget, from string, offer []byte, onProgress func(status int)) (OutLeg, []byte, error)
}

// DTMFSource is a SIP leg that reports SIP INFO keypresses (application/dtmf-relay or
// application/dtmf).
type DTMFSource interface {
	OnDTMF(func(digit string))
}

// Referrer is a call leg that can be transferred with SIP REFER.
type Referrer interface {
	Refer(target string) error
}

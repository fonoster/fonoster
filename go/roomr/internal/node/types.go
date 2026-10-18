// Package node is the media node: rooms that mix audio for their participants, driven over
// media-control (add-media-node/specs/media-control) and fed by SIP legs.
package node

import (
	"context"
	"strconv"

	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// Context is the standard context (aliased to keep signatures short).
type Context = context.Context

// Command is a media-control command; Reply is its one answer.
type Command map[string]any

// Event is published on media.<nodeId>.events.<roomRef>.
type Event map[string]any

// Ending reasons (media-control, "Endings carry a reason").
const (
	ReasonCallerHangup = "caller_hangup"
	ReasonCalleeHangup = "callee_hangup"
	ReasonRejected     = "rejected"
	ReasonMediaTimeout = "media_timeout"
	ReasonNodeError    = "node_error"
	ReasonMaxDuration  = "max_duration"
	ReasonRemoved      = "removed"
)

// CallLeg is the SIP side of a phone participant.
type CallLeg interface {
	// Ring sends 180 without early media.
	Ring() error
	// Answer sends 200 OK with the node's SDP.
	Answer(sdp []byte) error
	// Reject answers an unanswered INVITE with a final status.
	Reject(status int) error
	// Bye ends an answered call.
	Bye() error
}

// IncomingCall is an INVITE from Routr, already parsed.
type IncomingCall struct {
	From, To, CallerName string
	AppRef, CallRef      string
	Direction            string
	Headers              map[string]string
	Media                sdp.Media
	Leg                  CallLeg
	// OnRoom is told the room the call joined, before it is offered to the gateways.
	OnRoom func(roomRef string)
}

// DialError is a dial that ended without an answer.
type DialError struct{ Status int }

func (e *DialError) Error() string { return "dial failed with " + itoa(e.Status) }

// OutLeg is an answered outbound SIP leg.
type OutLeg interface {
	Bye() error
	// Gone closes when the remote party hangs up.
	Gone() <-chan struct{}
}

// Dialer places outbound legs through Routr (participant.dial and transfers).
type Dialer interface {
	// Dial sends an INVITE with offer; onProgress sees provisional statuses. It returns the leg and
	// the answer SDP, or a *DialError with the final status.
	Dial(ctx Context, to, from string, headers map[string]string, offer []byte, onProgress func(status int)) (OutLeg, []byte, error)
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

func itoa(i int) string { return strconv.Itoa(i) }

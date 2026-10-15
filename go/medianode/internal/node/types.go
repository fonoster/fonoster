// Package node is the media node: rooms that mix audio for their participants, driven over
// media-control (add-media-node/specs/media-control) and fed by SIP legs.
package node

import "github.com/fonoster/fonoster/go/medianode/internal/sdp"

// Command is a media-control command; Reply is its one answer.
type Command map[string]any

// Event is published on media.<nodeId>.events.<roomRef>.
type Event map[string]any

// Ending reasons (media-control, "Endings carry a reason").
const (
	ReasonCallerHangup = "caller_hangup"
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

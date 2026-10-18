//go:build !cgo || noopus

package audio

import "errors"

// OpusAvailable is false: this build has no libopus (no cgo, or the noopus tag).
const OpusAvailable = false

// Opus is unavailable in this build.
type Opus struct{}

// NewOpus always fails in builds without libopus.
func NewOpus() (*Opus, error) { return nil, errors.New("opus not built in") }

func (*Opus) Name() string        { return "opus" }
func (*Opus) ClockRate() int      { return 48000 }
func (*Opus) Encode(Frame) []byte { return nil }
func (*Opus) Decode([]byte) Frame { return Silence() }
func (*Opus) Conceal() Frame      { return Silence() }

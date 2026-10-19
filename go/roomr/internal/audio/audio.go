// Package audio holds the room's internal format (16-bit PCM, 16 kHz, 20 ms frames) and the
// conversions between it and the codecs on each leg.
package audio

import (
	"encoding/binary"
	"fmt"
	"strings"
)

const (
	// Rate is the room's internal sample rate.
	Rate = 16000
	// FrameMs is the packet time of every leg in this slice.
	FrameMs = 20
	// FrameSamples is one internal frame.
	FrameSamples = Rate * FrameMs / 1000
)

// Frame is one internal 20 ms frame.
type Frame []int16

// Silence returns a silent internal frame.
func Silence() Frame { return make(Frame, FrameSamples) }

// Codec converts between RTP payloads and internal frames.
type Codec interface {
	Name() string
	ClockRate() int
	Decode(payload []byte) Frame
	Encode(f Frame) []byte
}

// PCMU is G.711 μ-law at 8 kHz.
type PCMU struct{}

func (PCMU) Name() string   { return "PCMU" }
func (PCMU) ClockRate() int { return 8000 }
func (PCMU) Decode(p []byte) Frame {
	narrow := make([]int16, len(p))
	for i, b := range p {
		narrow[i] = ulawDecode[b]
	}
	return Upsample2(narrow)
}
func (PCMU) Encode(f Frame) []byte {
	narrow := Downsample2(f)
	out := make([]byte, len(narrow))
	for i, s := range narrow {
		out[i] = ulawEncode(s)
	}
	return out
}

// L16 is big-endian 16-bit PCM at 16 kHz (AppBridge's session leg).
type L16 struct{}

func (L16) Name() string   { return "L16" }
func (L16) ClockRate() int { return Rate }
func (L16) Decode(p []byte) Frame {
	f := make(Frame, len(p)/2)
	for i := range f {
		f[i] = int16(binary.BigEndian.Uint16(p[i*2:]))
	}
	return f
}
func (L16) Encode(f Frame) []byte {
	out := make([]byte, len(f)*2)
	for i, s := range f {
		binary.BigEndian.PutUint16(out[i*2:], uint16(s))
	}
	return out
}

// Concealer is a codec that can stand in for a lost packet (packet loss concealment).
type Concealer interface {
	Conceal() Frame
}

// Canonical SDP names (rtpmap without channels) of the codecs SIP legs can use.
const (
	NamePCMU = "PCMU/8000"
	NamePCMA = "PCMA/8000"
	NameG722 = "G722/8000"
	NameOpus = "opus/48000"
	NameL16  = "L16/16000"
)

// OfferOrder is the node's preference on SIP legs (redesign-roomr, "Supported codecs"):
// Opus, G.722, PCMU, PCMA. Opus is written as opus/48000/2 in SDP (RFC 7587).
var OfferOrder = []string{NameOpus, NameG722, NamePCMU, NamePCMA}

// PhoneCodecs lists the SIP-leg codecs this build supports, in OfferOrder (Opus only when built
// with libopus).
func PhoneCodecs() []string {
	out := []string{}
	for _, name := range OfferOrder {
		if name != NameOpus || OpusAvailable {
			out = append(out, name)
		}
	}
	return out
}

// ParseCodecList canonicalizes a configured SIP codec list ("opus", "G722/8000", "pcmu", ...),
// keeping its order and dropping duplicates. Empty means PhoneCodecs. Unknown names, L16 (not a
// SIP-leg codec) and Opus in a build without libopus are errors.
func ParseCodecList(names []string) ([]string, error) {
	out := []string{}
	seen := map[string]bool{}
	for _, raw := range names {
		raw = strings.TrimSpace(raw)
		if raw == "" {
			continue
		}
		name := canonical(raw)
		switch {
		case name == "" || name == NameL16:
			return nil, fmt.Errorf("unsupported SIP codec %q (use opus, G722, PCMU or PCMA)", raw)
		case name == NameOpus && !OpusAvailable:
			return nil, fmt.Errorf("codec %q: this build has no libopus (built without cgo)", raw)
		}
		if !seen[name] {
			seen[name] = true
			out = append(out, name)
		}
	}
	if len(out) == 0 {
		return PhoneCodecs(), nil
	}
	return out, nil
}

// StaticPayloadType returns the RFC 3551 static payload type of a codec, or -1 for dynamic ones.
func StaticPayloadType(name string) int {
	switch canonical(name) {
	case NamePCMU:
		return 0
	case NamePCMA:
		return 8
	case NameG722:
		return 9
	}
	return -1
}

func canonical(name string) string {
	switch strings.ToLower(name) {
	case "pcmu/8000", "pcmu":
		return NamePCMU
	case "pcma/8000", "pcma":
		return NamePCMA
	case "g722/8000", "g722":
		return NameG722
	case "opus/48000", "opus/48000/2", "opus":
		return NameOpus
	case "l16/16000", "l16":
		return NameL16
	}
	return ""
}

// CodecFor returns a fresh codec instance (stateful codecs keep per-stream state) for a
// media-control or SDP codec name ("PCMU/8000", "opus/48000/2", "L16/16000").
func CodecFor(name string) (Codec, bool) {
	switch canonical(name) {
	case NamePCMU:
		return PCMU{}, true
	case NamePCMA:
		return PCMA{}, true
	case NameG722:
		return NewG722(), true
	case NameOpus:
		if !OpusAvailable {
			return nil, false
		}
		c, err := NewOpus()
		if err != nil {
			return nil, false
		}
		return c, true
	case NameL16:
		return L16{}, true
	}
	return nil, false
}

// Upsample2 doubles the rate by linear interpolation (8 kHz → 16 kHz).
func Upsample2(in []int16) Frame {
	out := make(Frame, len(in)*2)
	for i, s := range in {
		next := s
		if i+1 < len(in) {
			next = in[i+1]
		}
		out[i*2] = s
		out[i*2+1] = int16((int32(s) + int32(next)) / 2)
	}
	return out
}

// Downsample2 halves the rate by averaging pairs (a crude low-pass, enough for telephony).
func Downsample2(in Frame) []int16 {
	out := make([]int16, len(in)/2)
	for i := range out {
		out[i] = int16((int32(in[i*2]) + int32(in[i*2+1])) / 2)
	}
	return out
}

// Mix adds frames with clipping; nil frames count as silence.
func Mix(frames ...Frame) Frame {
	out := make(Frame, FrameSamples)
	acc := make([]int32, FrameSamples)
	for _, f := range frames {
		for i := 0; i < len(f) && i < FrameSamples; i++ {
			acc[i] += int32(f[i])
		}
	}
	for i, v := range acc {
		if v > 32767 {
			v = 32767
		} else if v < -32768 {
			v = -32768
		}
		out[i] = int16(v)
	}
	return out
}

var ulawDecode [256]int16

func init() {
	for i := 0; i < 256; i++ {
		u := ^byte(i)
		t := (int32(u&0x0f) << 3) + 0x84
		t <<= (u & 0x70) >> 4
		if u&0x80 != 0 {
			ulawDecode[i] = int16(0x84 - t)
		} else {
			ulawDecode[i] = int16(t - 0x84)
		}
	}
}

func ulawEncode(sample int16) byte {
	const bias, clip = 0x84, 32635
	s := int32(sample)
	sign := byte(0)
	if s < 0 {
		s = -s
		sign = 0x80
	}
	if s > clip {
		s = clip
	}
	s += bias
	exponent := byte(7)
	for mask := int32(0x4000); s&mask == 0 && exponent > 0; mask >>= 1 {
		exponent--
	}
	mantissa := byte((s >> (exponent + 3)) & 0x0f)
	return ^(sign | exponent<<4 | mantissa)
}

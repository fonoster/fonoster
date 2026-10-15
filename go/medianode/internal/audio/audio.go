// Package audio holds the room's internal format (16-bit PCM, 16 kHz, 20 ms frames) and the
// conversions between it and the codecs on each leg.
package audio

import "encoding/binary"

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

// L16 is big-endian 16-bit PCM at 16 kHz (the gateway's session leg).
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

// CodecFor resolves a media-control or SDP codec name ("PCMU/8000", "L16/16000").
func CodecFor(name string) (Codec, bool) {
	switch name {
	case "PCMU/8000", "PCMU", "pcmu":
		return PCMU{}, true
	case "L16/16000", "L16", "l16":
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

package audio

import "github.com/gotranspile/g722"

// PCMA is G.711 A-law at 8 kHz.
type PCMA struct{}

func (PCMA) Name() string   { return "PCMA" }
func (PCMA) ClockRate() int { return 8000 }
func (PCMA) Decode(p []byte) Frame {
	narrow := make([]int16, len(p))
	for i, b := range p {
		narrow[i] = alawDecode[b]
	}
	return Upsample2(narrow)
}
func (PCMA) Encode(f Frame) []byte {
	narrow := Downsample2(f)
	out := make([]byte, len(narrow))
	for i, s := range narrow {
		out[i] = alawEncode(s)
	}
	return out
}

var alawDecode [256]int16

func init() {
	for i := 0; i < 256; i++ {
		a := byte(i) ^ 0x55
		t := int32(a&0x0f) << 4
		seg := (a & 0x70) >> 4
		switch seg {
		case 0:
			t += 8
		case 1:
			t += 0x108
		default:
			t += 0x108
			t <<= seg - 1
		}
		if a&0x80 != 0 {
			alawDecode[i] = int16(t)
		} else {
			alawDecode[i] = int16(-t)
		}
	}
}

func alawEncode(sample int16) byte {
	s := int32(sample) >> 3 // 13-bit magnitude
	mask := byte(0xd5)
	if s < 0 {
		mask = 0x55
		s = -s - 1
	}
	segEnd := [8]int32{0x1f, 0x3f, 0x7f, 0xff, 0x1ff, 0x3ff, 0x7ff, 0xfff}
	seg := 0
	for seg < 8 && s > segEnd[seg] {
		seg++
	}
	if seg >= 8 {
		return 0x7f ^ mask
	}
	aval := byte(seg) << 4
	if seg < 2 {
		aval |= byte(s>>1) & 0x0f
	} else {
		aval |= byte(s>>uint(seg)) & 0x0f
	}
	return aval ^ mask
}

// G722 is G.722 at 64 kbit/s: 16 kHz audio, an RTP clock of 8000 (RFC 3551's historic quirk).
// Encoder and decoder keep ADPCM state, so every stream needs its own instance.
type G722 struct {
	enc *g722.Encoder
	dec *g722.Decoder
}

// NewG722 returns a G.722 codec with fresh encoder and decoder state.
func NewG722() *G722 {
	return &G722{enc: g722.NewEncoder(g722.Rate64000, 0), dec: g722.NewDecoder(g722.Rate64000, 0)}
}

func (*G722) Name() string   { return "G722" }
func (*G722) ClockRate() int { return 8000 }
func (c *G722) Decode(p []byte) Frame {
	out := make(Frame, len(p)*2)
	n := c.dec.Decode(out, p)
	return out[:n]
}
func (c *G722) Encode(f Frame) []byte {
	out := make([]byte, len(f)/2)
	n := c.enc.Encode(out, f)
	return out[:n]
}

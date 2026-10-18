package audio

import (
	"math"
	"testing"
)

func TestULawRoundTrip(t *testing.T) {
	for _, s := range []int16{0, 100, -100, 1000, -1000, 8000, -8000, 30000, -30000} {
		got := ulawDecode[ulawEncode(s)]
		if diff := math.Abs(float64(got) - float64(s)); diff > math.Abs(float64(s))*0.07+16 {
			t.Errorf("μ-law round trip of %d gave %d", s, got)
		}
	}
}

func TestPCMUFrameSizes(t *testing.T) {
	f := PCMU{}.Decode(make([]byte, 160))
	if len(f) != FrameSamples {
		t.Fatalf("decoded %d samples, want %d", len(f), FrameSamples)
	}
	if n := len(PCMU{}.Encode(Silence())); n != 160 {
		t.Fatalf("encoded %d bytes, want 160", n)
	}
}

func TestMixMinusClips(t *testing.T) {
	a, b := Silence(), Silence()
	a[0], b[0] = 30000, 30000
	if got := Mix(a, b)[0]; got != 32767 {
		t.Fatalf("mix clipped to %d", got)
	}
}

func tone(freq float64, frames int) []Frame {
	out := make([]Frame, frames)
	for i := range out {
		f := Silence()
		for j := range f {
			n := float64(i*FrameSamples + j)
			f[j] = int16(8000 * math.Sin(2*math.Pi*freq*n/Rate))
		}
		out[i] = f
	}
	return out
}

// Goertzel power of freq in f, relative to total energy (1 means a pure tone).
func toneRatio(f Frame, freq float64) float64 {
	k := 2 * math.Cos(2*math.Pi*freq/Rate)
	var s1, s2, energy float64
	for _, x := range f {
		s := float64(x) + k*s1 - s2
		s2, s1 = s1, s
		energy += float64(x) * float64(x)
	}
	power := s1*s1 + s2*s2 - k*s1*s2
	if energy == 0 {
		return 0
	}
	return power / (energy * float64(len(f)) / 2)
}

func TestEachCodecCarriesATone(t *testing.T) {
	for _, name := range PhoneCodecs() {
		enc, ok := CodecFor(name)
		if !ok {
			t.Fatalf("%s not available", name)
		}
		dec, _ := CodecFor(name)
		var last Frame
		for i, f := range tone(1000, 20) {
			payload := enc.Encode(f)
			if len(payload) == 0 {
				t.Fatalf("%s: frame %d encoded to nothing", name, i)
			}
			last = dec.Decode(payload)
			if len(last) != FrameSamples {
				t.Fatalf("%s: decoded %d samples", name, len(last))
			}
		}
		if r := toneRatio(last, 1000); r < 0.8 {
			t.Errorf("%s: 1 kHz tone ratio after a round trip is %.2f", name, r)
		}
	}
}

func TestALawRoundTrip(t *testing.T) {
	for _, s := range []int16{0, 100, -100, 1000, -1000, 8000, -8000, 30000, -30000} {
		got := alawDecode[alawEncode(s)]
		if diff := math.Abs(float64(got) - float64(s)); diff > math.Abs(float64(s))*0.07+16 {
			t.Errorf("A-law round trip of %d gave %d", s, got)
		}
	}
}

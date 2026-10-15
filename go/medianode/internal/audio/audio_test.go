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

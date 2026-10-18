package dtmf

import (
	"math"
	"testing"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
)

func feedAll(d *Detector, frames []audio.Frame) string {
	out := ""
	for _, f := range frames {
		if digit, ok := d.Feed(f); ok {
			out += digit
		}
	}
	return out
}

func TestEveryDigitOnce(t *testing.T) {
	for _, digit := range "0123456789*#ABCD" {
		var d Detector
		frames := append(Tone(digit, 120), Tone(0, 60)...)
		if got := feedAll(&d, frames); got != string(digit) {
			t.Errorf("tone %c detected as %q", digit, got)
		}
	}
}

func TestThroughEachNarrowbandCodec(t *testing.T) {
	for _, name := range audio.PhoneCodecs() {
		enc, _ := audio.CodecFor(name)
		dec, _ := audio.CodecFor(name)
		var d Detector
		got := ""
		for _, f := range append(Tone('#', 120), append(Tone(0, 60), Tone('7', 120)...)...) {
			if digit, ok := d.Feed(dec.Decode(enc.Encode(f))); ok {
				got += digit
			}
		}
		if got != "#7" {
			t.Errorf("%s: detected %q", name, got)
		}
	}
}

func TestSpeechLikeToneIsNotADigit(t *testing.T) {
	var d Detector
	frames := make([]audio.Frame, 50)
	for i := range frames {
		f := audio.Silence()
		for j := range f {
			n := float64(i*audio.FrameSamples + j)
			f[j] = int16(8000 * math.Sin(2*math.Pi*440*n/audio.Rate))
		}
		frames[i] = f
	}
	if got := feedAll(&d, frames); got != "" {
		t.Fatalf("440 Hz detected as %q", got)
	}
}

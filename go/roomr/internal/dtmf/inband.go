// Package dtmf detects in-band DTMF tones in internal (16 kHz) frames with the Goertzel
// algorithm. The node runs it only on legs with neither RFC 4733 nor SIP INFO (MN8).
package dtmf

import (
	"math"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
)

var (
	rows   = [4]float64{697, 770, 852, 941}
	cols   = [4]float64{1209, 1336, 1477, 1633}
	keypad = [4][4]byte{
		{'1', '2', '3', 'A'},
		{'4', '5', '6', 'B'},
		{'7', '8', '9', 'C'},
		{'*', '0', '#', 'D'},
	}
	rowCoef, colCoef [4]float64
)

func init() {
	for i := range rows {
		rowCoef[i] = 2 * math.Cos(2*math.Pi*rows[i]/audio.Rate)
		colCoef[i] = 2 * math.Cos(2*math.Pi*cols[i]/audio.Rate)
	}
}

// Detector reports each keypress once: a digit must be present in two consecutive frames
// (40 ms) to count, and absent for two frames before the same or another digit counts again.
type Detector struct {
	candidate byte
	seen      int
	reported  bool
	absent    int
}

// goertzel returns the power at a frequency, normalized so a full-scale pure tone of the frame's
// energy gives 1.
func goertzel(f audio.Frame, coef float64, energy float64) float64 {
	var s1, s2 float64
	for _, x := range f {
		s := float64(x) + coef*s1 - s2
		s2, s1 = s1, s
	}
	power := s1*s1 + s2*s2 - coef*s1*s2
	return power / (energy * float64(len(f)) / 2)
}

// Classify returns the digit a single frame carries, or 0.
func Classify(f audio.Frame) byte {
	var energy float64
	for _, x := range f {
		energy += float64(x) * float64(x)
	}
	if len(f) == 0 || math.Sqrt(energy/float64(len(f))) < 150 {
		return 0
	}
	best := func(coefs [4]float64) (int, float64, float64) {
		bi, bp, second := 0, -1.0, 0.0
		for i, c := range coefs {
			p := goertzel(f, c, energy)
			if p > bp {
				second = math.Max(second, bp)
				bi, bp = i, p
			} else if p > second {
				second = p
			}
		}
		return bi, bp, second
	}
	ri, rp, r2 := best(rowCoef)
	ci, cp, c2 := best(colCoef)
	// Both tones strong, together most of the energy, each well above its runner-up, and the
	// twist between them within about 8 dB.
	if rp < 0.15 || cp < 0.15 || rp+cp < 0.6 || r2 > rp*0.2 || c2 > cp*0.2 {
		return 0
	}
	if rp/cp > 6.3 || cp/rp > 6.3 {
		return 0
	}
	return keypad[ri][ci]
}

// Feed takes one frame and returns a digit when a new keypress is confirmed.
func (d *Detector) Feed(f audio.Frame) (string, bool) {
	digit := Classify(f)
	if digit == 0 {
		d.absent++
		if d.absent >= 2 {
			d.candidate, d.seen, d.reported = 0, 0, false
		}
		return "", false
	}
	d.absent = 0
	if digit != d.candidate {
		d.candidate, d.seen, d.reported = digit, 0, false
	}
	d.seen++
	if d.seen >= 2 && !d.reported {
		d.reported = true
		return string(digit), true
	}
	return "", false
}

// Tone returns frames of the DTMF tone for a digit (for the caller bot and tests).
func Tone(digit rune, ms int) []audio.Frame {
	var lo, hi float64
	for r := range keypad {
		for c := range keypad[r] {
			if rune(keypad[r][c]) == digit {
				lo, hi = rows[r], cols[c]
			}
		}
	}
	frames := ms / audio.FrameMs
	out := make([]audio.Frame, frames)
	for i := range out {
		f := audio.Silence()
		if lo > 0 {
			for j := range f {
				t := float64(i*audio.FrameSamples+j) / audio.Rate
				f[j] = int16(5000*math.Sin(2*math.Pi*lo*t) + 5000*math.Sin(2*math.Pi*hi*t))
			}
		}
		out[i] = f
	}
	return out
}

//go:build cgo && !noopus

package audio

/*
#cgo darwin CFLAGS: -I/opt/homebrew/include -I/usr/local/include
#cgo darwin LDFLAGS: -L/opt/homebrew/lib -L/usr/local/lib -lopus
#cgo linux LDFLAGS: -lopus -lm
#include <opus/opus.h>

static int fo_set_bitrate(OpusEncoder *e, int b) { return opus_encoder_ctl(e, OPUS_SET_BITRATE(b)); }
static int fo_set_fec(OpusEncoder *e, int on) { return opus_encoder_ctl(e, OPUS_SET_INBAND_FEC(on)); }
static int fo_set_loss(OpusEncoder *e, int pct) { return opus_encoder_ctl(e, OPUS_SET_PACKET_LOSS_PERC(pct)); }
static int fo_set_complexity(OpusEncoder *e, int c) { return opus_encoder_ctl(e, OPUS_SET_COMPLEXITY(c)); }
*/
import "C"

import (
	"fmt"
	"unsafe"
)

// OpusAvailable is true when the build links libopus (cgo, without the noopus tag).
const OpusAvailable = true

// opusComplexity trades CPU for quality (0-10; libopus defaults to 10). 5 roughly halves the
// encoder's cost and is plenty for narrowband telephony.
const opusComplexity = 5

// Opus is mono Opus at the room rate (16 kHz in, 16 kHz out); its RTP clock is always 48000.
type Opus struct {
	enc *C.OpusEncoder
	dec *C.OpusDecoder
}

// NewOpus creates an encoder and a decoder. They are freed by the garbage collector's finalizer
// rather than an explicit Close, because legs hand codecs around without owning them.
func NewOpus() (*Opus, error) {
	var errc C.int
	enc := C.opus_encoder_create(C.opus_int32(Rate), 1, C.OPUS_APPLICATION_VOIP, &errc)
	if errc != C.OPUS_OK {
		return nil, fmt.Errorf("opus encoder: %d", int(errc))
	}
	dec := C.opus_decoder_create(C.opus_int32(Rate), 1, &errc)
	if errc != C.OPUS_OK {
		C.opus_encoder_destroy(enc)
		return nil, fmt.Errorf("opus decoder: %d", int(errc))
	}
	C.fo_set_bitrate(enc, 24000)
	C.fo_set_fec(enc, 1)
	C.fo_set_loss(enc, 5)
	C.fo_set_complexity(enc, opusComplexity)
	o := &Opus{enc: enc, dec: dec}
	setOpusFinalizer(o)
	return o, nil
}

func (*Opus) Name() string   { return "opus" }
func (*Opus) ClockRate() int { return 48000 }

func (o *Opus) Encode(f Frame) []byte {
	if len(f) != FrameSamples {
		f = Mix(f) // pads or trims to one frame
	}
	out := make([]byte, 400)
	n := C.opus_encode(o.enc, (*C.opus_int16)(unsafe.Pointer(&f[0])), C.int(len(f)),
		(*C.uchar)(unsafe.Pointer(&out[0])), C.opus_int32(len(out)))
	if n < 0 {
		return nil
	}
	return out[:n]
}

func (o *Opus) Decode(p []byte) Frame {
	out := make(Frame, FrameSamples*6) // up to 120 ms
	if len(p) == 0 {
		return o.Conceal()
	}
	n := C.opus_decode(o.dec, (*C.uchar)(unsafe.Pointer(&p[0])), C.opus_int32(len(p)),
		(*C.opus_int16)(unsafe.Pointer(&out[0])), C.int(len(out)), 0)
	if n < 0 {
		return Silence()
	}
	return out[:n]
}

// Conceal runs Opus's own packet loss concealment for one frame.
func (o *Opus) Conceal() Frame {
	out := make(Frame, FrameSamples)
	n := C.opus_decode(o.dec, nil, 0, (*C.opus_int16)(unsafe.Pointer(&out[0])), C.int(FrameSamples), 0)
	if n < 0 {
		return Silence()
	}
	return out[:n]
}

func (o *Opus) free() {
	if o.enc != nil {
		C.opus_encoder_destroy(o.enc)
		o.enc = nil
	}
	if o.dec != nil {
		C.opus_decoder_destroy(o.dec)
		o.dec = nil
	}
}

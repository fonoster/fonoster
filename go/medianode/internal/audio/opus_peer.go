//go:build cgo && !noopus

package audio

/*
#include <opus/opus.h>
*/
import "C"

import (
	"fmt"
	"unsafe"
)

// fullbandPeer is a 48 kHz Opus encoder and decoder, standing in for a browser or a phone that
// runs Opus at its native rate, so tests can check the node's 16 kHz codec against it (RFC 7587:
// any decoder rate can decode any stream). Not used by the node itself.
type fullbandPeer struct {
	enc *C.OpusEncoder
	dec *C.OpusDecoder
}

const peerRate = 48000

func newFullbandPeer() (*fullbandPeer, error) {
	var errc C.int
	enc := C.opus_encoder_create(peerRate, 1, C.OPUS_APPLICATION_VOIP, &errc)
	if errc != C.OPUS_OK {
		return nil, fmt.Errorf("opus encoder: %d", int(errc))
	}
	dec := C.opus_decoder_create(peerRate, 1, &errc)
	if errc != C.OPUS_OK {
		C.opus_encoder_destroy(enc)
		return nil, fmt.Errorf("opus decoder: %d", int(errc))
	}
	return &fullbandPeer{enc: enc, dec: dec}, nil
}

// encode takes one 20 ms frame at 48 kHz (960 samples).
func (p *fullbandPeer) encode(pcm []int16) []byte {
	out := make([]byte, 1500)
	n := C.opus_encode(p.enc, (*C.opus_int16)(unsafe.Pointer(&pcm[0])), C.int(len(pcm)),
		(*C.uchar)(unsafe.Pointer(&out[0])), C.opus_int32(len(out)))
	if n < 0 {
		return nil
	}
	return out[:n]
}

// decode returns 48 kHz samples.
func (p *fullbandPeer) decode(pkt []byte) []int16 {
	out := make([]int16, peerRate*120/1000)
	n := C.opus_decode(p.dec, (*C.uchar)(unsafe.Pointer(&pkt[0])), C.opus_int32(len(pkt)),
		(*C.opus_int16)(unsafe.Pointer(&out[0])), C.int(len(out)), 0)
	if n < 0 {
		return nil
	}
	return out[:n]
}

func (p *fullbandPeer) close() {
	C.opus_encoder_destroy(p.enc)
	C.opus_decoder_destroy(p.dec)
}

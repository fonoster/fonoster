package node

import (
	"encoding/binary"
	"fmt"
	"io"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
)

// Hold audio: the music a caller hears on hold (Hold{music}) or while a warm transfer dials. It is
// the only audio the node fetches itself, because only the node can play to the caller alone (the
// app is cut off while the caller is held). Everything else an app wants heard it plays on its
// own RTP leg.

// fetchHoldAudio reads a PCM16 WAV (8 or 16 kHz, mono) into internal frames, looped by the room
// while the participant is held. The caller (AppBridge) has already checked the URL is a public
// destination; the fetch times out after 10 s.
func (n *Node) fetchHoldAudio(url string) ([]audio.Frame, error) {
	res, err := n.holdAudio.Get(url)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return nil, fmt.Errorf("status %d", res.StatusCode)
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, 20<<20))
	if err != nil {
		return nil, err
	}
	if len(data) < 44 || string(data[0:4]) != "RIFF" || string(data[8:12]) != "WAVE" {
		return nil, fmt.Errorf("not a WAV file")
	}
	var rate, bits, channels int
	var pcm []byte
	for off := 12; off+8 <= len(data); {
		id := string(data[off : off+4])
		size := int(binary.LittleEndian.Uint32(data[off+4:]))
		body := data[off+8 : min(len(data), off+8+size)]
		switch id {
		case "fmt ":
			if len(body) >= 16 {
				channels = int(binary.LittleEndian.Uint16(body[2:]))
				rate = int(binary.LittleEndian.Uint32(body[4:]))
				bits = int(binary.LittleEndian.Uint16(body[14:]))
			}
		case "data":
			pcm = body
		}
		off += 8 + size + size%2
	}
	if bits != 16 || channels != 1 || (rate != 8000 && rate != 16000) {
		return nil, fmt.Errorf("need mono 16-bit PCM at 8 or 16 kHz")
	}
	samples := make([]int16, len(pcm)/2)
	for i := range samples {
		samples[i] = int16(binary.LittleEndian.Uint16(pcm[i*2:]))
	}
	var wide []int16 = samples
	if rate == 8000 {
		wide = audio.Upsample2(samples)
	}
	var frames []audio.Frame
	for i := 0; i+audio.FrameSamples <= len(wide); i += audio.FrameSamples {
		frames = append(frames, audio.Frame(wide[i:i+audio.FrameSamples]))
	}
	return frames, nil
}

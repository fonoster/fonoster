package audio

import (
	"math"
	"reflect"
	"testing"
)

func TestOfferOrderPutsOpusFirst(t *testing.T) {
	want := []string{NameOpus, NameG722, NamePCMU, NamePCMA}
	if !OpusAvailable {
		want = want[1:]
	}
	if got := PhoneCodecs(); !reflect.DeepEqual(got, want) {
		t.Fatalf("PhoneCodecs() = %v, want %v", got, want)
	}
}

func TestParseCodecList(t *testing.T) {
	got, err := ParseCodecList([]string{" pcmu", "PCMA/8000", "pcmu", "g722"})
	if err != nil || !reflect.DeepEqual(got, []string{NamePCMU, NamePCMA, NameG722}) {
		t.Fatalf("got %v %v", got, err)
	}
	if got, err := ParseCodecList([]string{""}); err != nil || !reflect.DeepEqual(got, PhoneCodecs()) {
		t.Fatalf("empty list: %v %v", got, err)
	}
	for _, bad := range []string{"GSM/8000", "L16/16000"} {
		if _, err := ParseCodecList([]string{bad}); err == nil {
			t.Errorf("%s accepted", bad)
		}
	}
	got, err = ParseCodecList([]string{"opus/48000/2", "PCMU"})
	if OpusAvailable {
		if err != nil || !reflect.DeepEqual(got, []string{NameOpus, NamePCMU}) {
			t.Fatalf("opus list: %v %v", got, err)
		}
	} else if err == nil {
		t.Fatal("opus accepted in a build without libopus")
	}
}

// toneAt makes one frame of a tone at an arbitrary rate, continuing from frame i.
func toneAt(freq float64, rate, i int) []int16 {
	n := rate * FrameMs / 1000
	out := make([]int16, n)
	for j := range out {
		out[j] = int16(8000 * math.Sin(2*math.Pi*freq*float64(i*n+j)/float64(rate)))
	}
	return out
}

func ratioAt(f []int16, freq float64, rate int) float64 {
	k := 2 * math.Cos(2*math.Pi*freq/float64(rate))
	var s1, s2, energy float64
	for _, x := range f {
		s := float64(x) + k*s1 - s2
		s2, s1 = s1, s
		energy += float64(x) * float64(x)
	}
	if energy == 0 {
		return 0
	}
	return (s1*s1 + s2*s2 - k*s1*s2) / (energy * float64(len(f)) / 2)
}

// Opus runs on a 48 kHz RTP clock while the room mixes at 16 kHz: the node's codec must decode a
// full-band peer's 48 kHz stream into 16 kHz frames, and a 48 kHz peer must decode what the node
// sends, with wideband content (6 kHz, above G.711's band) intact both ways.
func TestOpusBridgesA48kPeerAndThe16kRoom(t *testing.T) {
	if !OpusAvailable {
		t.Skip("built without libopus")
	}
	if c := (&Opus{}).ClockRate(); c*FrameMs/1000 != 960 {
		t.Fatalf("RTP timestamp step %d per 20 ms frame, want 960 (RFC 7587)", c*FrameMs/1000)
	}
	peer, err := newFullbandPeer()
	if err != nil {
		t.Fatal(err)
	}
	defer peer.close()
	node, _ := CodecFor(NameOpus)
	const freq = 6000
	var toRoom Frame
	var toPeer []int16
	for i := 0; i < 25; i++ {
		toRoom = node.Decode(peer.encode(toneAt(freq, 48000, i)))
		if len(toRoom) != FrameSamples {
			t.Fatalf("peer frame decoded to %d samples, want %d", len(toRoom), FrameSamples)
		}
		toPeer = peer.decode(node.Encode(Frame(toneAt(freq, Rate, i))))
		if len(toPeer) != 960 {
			t.Fatalf("node frame decoded by the peer to %d samples, want 960", len(toPeer))
		}
	}
	if r := ratioAt(toRoom, freq, Rate); r < 0.7 {
		t.Errorf("48 kHz peer to room: 6 kHz tone ratio %.2f", r)
	}
	if r := ratioAt(toPeer, freq, 48000); r < 0.7 {
		t.Errorf("room to 48 kHz peer: 6 kHz tone ratio %.2f", r)
	}
}

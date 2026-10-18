package node

import (
	"errors"
	"reflect"
	"testing"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// offerFor captures the SDP the node's INVITE carries (dialLeg, used by participant.dial,
// transfers and Roomr's CreateCall) for a codec setting.
func offerFor(t *testing.T, codecs []string) sdp.Media {
	t.Helper()
	n := &Node{cfg: Config{RTPHost: "127.0.0.1", Codecs: codecs}}
	n.cfg.defaults()
	var sent []byte
	_, err := (&Room{node: n}).dialLeg(func(offer []byte, _ func(int)) (OutLeg, []byte, error) {
		sent = offer
		return nil, nil, errors.New("not dialing")
	}, func() {})
	if err == nil || sent == nil {
		t.Fatalf("dialLeg: %v", err)
	}
	m, err := sdp.Parse(sent)
	if err != nil {
		t.Fatal(err)
	}
	return m
}

func TestOutboundOfferOrder(t *testing.T) {
	m := offerFor(t, nil)
	names := []string{}
	for _, pt := range m.PayloadTypes {
		names = append(names, m.Codecs[pt])
	}
	want := []string{"G722/8000", "PCMU/8000", "PCMA/8000", "telephone-event/8000"}
	if audio.OpusAvailable {
		want = append([]string{"opus/48000"}, want...)
		if m.PayloadTypes[0] != 111 || m.Fmtp[111] != sdp.OpusFmtp {
			t.Fatalf("Opus as PT %d with fmtp %q", m.PayloadTypes[0], m.Fmtp[111])
		}
	}
	if !reflect.DeepEqual(names, want) {
		t.Fatalf("offer lists %v, want %v", names, want)
	}
}

func TestOpusCanBeLeftOut(t *testing.T) {
	m := offerFor(t, []string{audio.NamePCMU, audio.NamePCMA})
	if !reflect.DeepEqual(m.PayloadTypes, []int{0, 8, 101}) {
		t.Fatalf("offer payload types %v", m.PayloadTypes)
	}
}

package node

import (
	"reflect"
	"testing"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/sdp"
)

// offerFor is the SDP the node's INVITEs carry (CreateCall and transfers) for a codec setting.
func offerFor(t *testing.T, codecs []string) sdp.Media {
	t.Helper()
	n := New(nil, Config{RTPHost: "127.0.0.1", Codecs: codecs})
	m, err := sdp.Parse(n.offer(40000))
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

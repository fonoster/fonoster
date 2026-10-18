package sdp

import (
	"strings"
	"testing"
)

const offer = "v=0\r\no=- 1 1 IN IP4 10.0.0.9\r\ns=-\r\nc=IN IP4 10.0.0.9\r\nt=0 0\r\n" +
	"m=audio 4000 RTP/AVP 9 0 101\r\na=rtpmap:101 telephone-event/8000\r\na=fmtp:101 0-16\r\n"

func TestParseOffer(t *testing.T) {
	m, err := Parse([]byte(offer))
	if err != nil {
		t.Fatal(err)
	}
	if m.Host != "10.0.0.9" || m.Port != 4000 || m.DTMF != 101 {
		t.Fatalf("parsed %+v", m)
	}
	pt, codec, ok := m.Choose("PCMU/8000")
	if !ok || pt != 0 || codec != "PCMU/8000" {
		t.Fatalf("chose %d %s %v", pt, codec, ok)
	}
}

func TestNoCommonCodec(t *testing.T) {
	m, _ := Parse([]byte("v=0\r\nc=IN IP4 1.2.3.4\r\nm=audio 5 RTP/AVP 3\r\n"))
	if _, _, ok := m.Choose("PCMU/8000"); ok {
		t.Fatal("GSM matched PCMU")
	}
}

func TestWriteRoundTrip(t *testing.T) {
	m, err := Parse(Write("127.0.0.1", 5004, 0, "PCMU/8000", 101))
	if err != nil || m.Port != 5004 || m.DTMF != 101 || m.Codecs[0] != "PCMU/8000" {
		t.Fatalf("round trip %+v %v", m, err)
	}
}

func TestOpusAndCryptoRoundTrip(t *testing.T) {
	body := WriteDescription(Description{Host: "10.0.0.1", Port: 6000, DTMF: -1,
		Codecs: []Codec{{111, "opus/48000"}, {8, "PCMA/8000"}},
		Crypto: &Crypto{Tag: 1, Suite: "AES_CM_128_HMAC_SHA1_80", Key: "abc"}})
	m, err := Parse(body)
	if err != nil {
		t.Fatal(err)
	}
	if !m.Secure || len(m.Crypto) != 1 || m.Crypto[0].Key != "abc" || m.DTMF != -1 {
		t.Fatalf("parsed %+v", m)
	}
	if pt, name, ok := m.Choose("G722/8000", "opus/48000"); !ok || pt != 111 || name != "opus/48000" {
		t.Fatalf("chose %d %s", pt, name)
	}
}

// An Opus-capable peer's offer (PCMU listed first) and a G.711-only trunk's offer, answered with
// the node's order: Opus whenever offered, PCMU from the trunk.
func TestChoosePreferredTakesTheNodesOrder(t *testing.T) {
	node := []string{"opus/48000", "G722/8000", "PCMU/8000", "PCMA/8000"}
	opusPeer, err := Parse([]byte("v=0\r\nc=IN IP4 10.0.0.2\r\nm=audio 4000 RTP/AVP 0 8 96 101\r\n" +
		"a=rtpmap:96 OPUS/48000/2\r\na=fmtp:96 useinbandfec=1; maxplaybackrate=48000\r\n" +
		"a=rtpmap:101 telephone-event/8000\r\n"))
	if err != nil {
		t.Fatal(err)
	}
	if pt, name, ok := opusPeer.ChoosePreferred(node...); !ok || pt != 96 || name != "opus/48000" {
		t.Fatalf("Opus peer: chose %d %s %v", pt, name, ok)
	}
	if pt, _, _ := opusPeer.Choose(node...); pt != 0 {
		t.Fatalf("Choose keeps the remote's order, got %d", pt)
	}
	if got := opusPeer.Fmtp[96]; got != "useinbandfec=1; maxplaybackrate=48000" {
		t.Fatalf("fmtp %q", got)
	}
	trunk, _ := Parse([]byte("v=0\r\nc=IN IP4 10.0.0.3\r\nm=audio 4002 RTP/AVP 8 0\r\n"))
	if pt, name, ok := trunk.ChoosePreferred(node...); !ok || pt != 0 || name != "PCMU/8000" {
		t.Fatalf("G.711 trunk: chose %d %s %v", pt, name, ok)
	}
	if _, _, ok := trunk.ChoosePreferred("opus/48000"); ok {
		t.Fatal("Opus-only node accepted a G.711 offer")
	}
}

func TestOpusIsWrittenPerRFC7587(t *testing.T) {
	body := string(WriteDescription(Description{Host: "10.0.0.1", Port: 6000, DTMF: 101,
		Codecs: []Codec{{111, "opus/48000"}, {9, "G722/8000"}, {0, "PCMU/8000"}, {8, "PCMA/8000"}}}))
	for _, line := range []string{
		"m=audio 6000 RTP/AVP 111 9 0 8 101\r\n",
		"a=rtpmap:111 opus/48000/2\r\n",
		"a=fmtp:111 maxplaybackrate=16000;sprop-maxcapturerate=16000;useinbandfec=1\r\n",
	} {
		if !strings.Contains(body, line) {
			t.Errorf("offer lacks %q:\n%s", line, body)
		}
	}
}

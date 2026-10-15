package sdp

import "testing"

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

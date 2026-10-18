package caller

import (
	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"net"
	"strings"
	"testing"
	"time"
)

// A carrier calls Routr with the Trunk's host in the Request-URI while sending the INVITE to
// Routr's address; the bot does the same with DialVia (CO-B1).
func TestDialViaSetsRequestURIHostAndAdvertisedVia(t *testing.T) {
	l, err := net.ListenPacket("udp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()

	bot, err := NewWithOptions(Options{Host: "127.0.0.1", SIPAdvertise: "192.0.2.10"})
	if err != nil {
		t.Fatal(err)
	}
	defer bot.Close()

	if _, err := bot.DialVia(l.LocalAddr().String(), "trunk.example.net", "+17853178070", "+15550001111",
		map[string]string{"X-Test": "1"}); err != nil {
		t.Fatal(err)
	}
	_ = l.SetReadDeadline(time.Now().Add(3 * time.Second))
	buf := make([]byte, 4096)
	n, _, err := l.ReadFrom(buf)
	if err != nil {
		t.Fatal(err)
	}
	msg := string(buf[:n])
	if first := strings.SplitN(msg, "\r\n", 2)[0]; first != "INVITE sip:+17853178070@trunk.example.net SIP/2.0" {
		t.Fatalf("request line = %q", first)
	}
	via := ""
	contact := ""
	for _, line := range strings.Split(msg, "\r\n") {
		if strings.HasPrefix(line, "Via:") {
			via = line
		}
		if strings.HasPrefix(line, "Contact:") {
			contact = line
		}
	}
	if !strings.Contains(via, "192.0.2.10") || !strings.Contains(via, "rport") {
		t.Fatalf("Via = %q, want the advertised host and rport", via)
	}
	if !strings.Contains(contact, "192.0.2.10") {
		t.Fatalf("Contact = %q, want the advertised host", contact)
	}
}

func TestDialKeepsTargetAsRequestURI(t *testing.T) {
	l, err := net.ListenPacket("udp4", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer l.Close()
	bot, err := New("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer bot.Close()
	if _, err := bot.Dial(l.LocalAddr().String(), "+1555", "", nil); err != nil {
		t.Fatal(err)
	}
	_ = l.SetReadDeadline(time.Now().Add(3 * time.Second))
	buf := make([]byte, 4096)
	n, _, err := l.ReadFrom(buf)
	if err != nil {
		t.Fatal(err)
	}
	want := "INVITE sip:+1555@" + l.LocalAddr().String() + " SIP/2.0"
	if first := strings.SplitN(string(buf[:n]), "\r\n", 2)[0]; first != want {
		t.Fatalf("request line = %q, want %q", first, want)
	}
}

func TestSpeakPCMFramesRecordedSpeechAndHeardRoundTrips(t *testing.T) {
	c := &Call{}
	// 1.5 frames of a ramp: the second frame is padded with silence.
	samples := audio.FrameSamples * 3 / 2
	pcm := make([]byte, samples*2)
	for i := 0; i < samples; i++ {
		v := int16(i - 100)
		pcm[i*2], pcm[i*2+1] = byte(v), byte(uint16(v)>>8)
	}
	c.SpeakPCM(pcm)
	if len(c.pending) != 2 {
		t.Fatalf("frames = %d, want 2", len(c.pending))
	}
	if c.pending[0][0] != -100 || c.pending[1][audio.FrameSamples/2-1] != int16(samples-1-100) || c.pending[1][audio.FrameSamples-1] != 0 {
		t.Fatalf("unexpected samples")
	}
	for _, f := range c.pending {
		c.heard(f)
	}
	got := c.Heard()
	if len(got) != 2*audio.FrameSamples*2 || string(got[:len(pcm)]) != string(pcm) {
		t.Fatalf("heard audio does not round-trip (%d bytes)", len(got))
	}
	if s := c.Status(); s.FirstAudibleAfter != -1 || s.SpokeUntil != 0 {
		t.Fatalf("status = %+v", s)
	}
}

package rtpio

import (
	"net"
	"sync/atomic"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/pion/rtp"
)

// RV-B8: one source per stream; other senders cannot inject audio.
func TestLatchesToRemoteAndDropsOtherSenders(t *testing.T) {
	e, err := Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer e.conn.Close()
	remote, _ := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1)})
	defer remote.Close()
	intruder, _ := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1)})
	defer intruder.Close()
	if err := e.Configure(audio.L16{}, 96, -1, "127.0.0.1", remote.LocalAddr().(*net.UDPAddr).Port); err != nil {
		t.Fatal(err)
	}
	var got atomic.Int64
	go e.Serve(Handlers{Audio: func(audio.Frame) { got.Add(1) }})

	to := &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1), Port: e.Port()}
	seq := uint16(1)
	send := func(c *net.UDPConn) {
		p := rtp.Packet{Header: rtp.Header{Version: 2, PayloadType: 96, SequenceNumber: seq, SSRC: 7},
			Payload: make([]byte, 640)}
		seq++
		raw, _ := p.Marshal()
		_, _ = c.WriteToUDP(raw, to)
		time.Sleep(5 * time.Millisecond)
	}
	// The intruder speaks first and is latched as the first source...
	send(intruder)
	// ...until the SDP remote sends: it takes over for good.
	send(remote)
	for i := 0; i < 5; i++ {
		send(intruder)
	}
	send(remote)
	time.Sleep(50 * time.Millisecond)
	if n := got.Load(); n != 3 {
		t.Fatalf("%d frames accepted, want 3 (first intruder packet, then the remote's two)", n)
	}
	if f := e.Stats().Foreign; f != 5 {
		t.Fatalf("%d foreign packets, want 5", f)
	}
}

func TestLatchesToFirstSourceWithoutRemote(t *testing.T) {
	e, err := Listen("127.0.0.1")
	if err != nil {
		t.Fatal(err)
	}
	defer e.conn.Close()
	a, _ := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1)})
	defer a.Close()
	b, _ := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1)})
	defer b.Close()
	// The remote in the SDP is somewhere else (NAT): the first valid source is latched.
	if err := e.Configure(audio.L16{}, 96, -1, "127.0.0.1", 9); err != nil {
		t.Fatal(err)
	}
	var got atomic.Int64
	go e.Serve(Handlers{Audio: func(audio.Frame) { got.Add(1) }})
	to := &net.UDPAddr{IP: net.IPv4(127, 0, 0, 1), Port: e.Port()}
	for i, c := range []*net.UDPConn{a, b, a, b} {
		p := rtp.Packet{Header: rtp.Header{Version: 2, PayloadType: 96, SequenceNumber: uint16(i)}, Payload: make([]byte, 640)}
		raw, _ := p.Marshal()
		_, _ = c.WriteToUDP(raw, to)
		time.Sleep(5 * time.Millisecond)
	}
	time.Sleep(50 * time.Millisecond)
	if n, f := got.Load(), e.Stats().Foreign; n != 2 || f != 2 {
		t.Fatalf("accepted %d, foreign %d; want 2 and 2", n, f)
	}
}

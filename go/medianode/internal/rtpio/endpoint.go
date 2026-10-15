// Package rtpio is one RTP stream over UDP: receive with RFC 4733 DTMF detection, and send in
// the leg's codec.
package rtpio

import (
	"fmt"
	"math/rand"
	"net"
	"strconv"
	"sync"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/pion/rtp"
)

// Handlers receive decoded audio and DTMF digits.
type Handlers struct {
	Audio func(audio.Frame)
	DTMF  func(digit string)
}

// Endpoint is a local UDP port and the remote it talks to.
type Endpoint struct {
	conn        *net.UDPConn
	mu          sync.Mutex
	remote      *net.UDPAddr
	codec       audio.Codec
	payloadType uint8
	dtmfType    int
	seq         uint16
	timestamp   uint32
	SSRC        uint32
	lastPacket  time.Time
	lastEvent   uint32
	closed      bool
}

var dtmfDigits = "0123456789*#ABCD"

var (
	rangeMu          sync.Mutex
	portMin, portMax int
	portNext         int
)

// SetPortRange limits the UDP ports Listen binds to [min, max] (both 0 restores "any port").
// Operators publish exactly this range on the node's container or pod.
func SetPortRange(min, max int) {
	rangeMu.Lock()
	defer rangeMu.Unlock()
	portMin, portMax, portNext = min, max, min
}

func listenUDP(host string) (*net.UDPConn, error) {
	ip := net.ParseIP(host)
	rangeMu.Lock()
	lo, hi, start := portMin, portMax, portNext
	rangeMu.Unlock()
	if hi == 0 {
		return net.ListenUDP("udp4", &net.UDPAddr{IP: ip})
	}
	size := hi - lo + 1
	var lastErr error
	for i := 0; i < size; i++ {
		port := lo + (start-lo+i)%size
		conn, err := net.ListenUDP("udp4", &net.UDPAddr{IP: ip, Port: port})
		if err == nil {
			rangeMu.Lock()
			portNext = lo + (port-lo+1)%size
			rangeMu.Unlock()
			return conn, nil
		}
		lastErr = err
	}
	return nil, fmt.Errorf("rtp port range %d-%d exhausted: %w", lo, hi, lastErr)
}

// Listen binds a UDP port on host (0 picks one; with SetPortRange, one inside the range).
func Listen(host string) (*Endpoint, error) {
	conn, err := listenUDP(host)
	if err != nil {
		return nil, err
	}
	return &Endpoint{
		conn:       conn,
		SSRC:       rand.Uint32(),
		seq:        uint16(rand.Uint32()),
		timestamp:  rand.Uint32(),
		dtmfType:   -1,
		lastPacket: time.Now(),
	}, nil
}

// Port is the bound port.
func (e *Endpoint) Port() int { return e.conn.LocalAddr().(*net.UDPAddr).Port }

// Configure sets the codec, payload type, DTMF payload type (-1 for none) and remote.
func (e *Endpoint) Configure(codec audio.Codec, payloadType int, dtmfType int, remoteHost string, remotePort int) error {
	addr, err := net.ResolveUDPAddr("udp4", net.JoinHostPort(remoteHost, strconv.Itoa(remotePort)))
	if err != nil {
		return err
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	e.codec, e.payloadType, e.dtmfType, e.remote = codec, uint8(payloadType), dtmfType, addr
	return nil
}

// LastPacketAt is when the last RTP packet arrived (for media timeouts).
func (e *Endpoint) LastPacketAt() time.Time {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.lastPacket
}

// Serve reads packets until Close.
func (e *Endpoint) Serve(h Handlers) {
	buf := make([]byte, 1500)
	for {
		n, _, err := e.conn.ReadFromUDP(buf)
		if err != nil {
			return
		}
		var p rtp.Packet
		if err := p.Unmarshal(buf[:n]); err != nil {
			continue
		}
		e.mu.Lock()
		e.lastPacket = time.Now()
		codec, dtmfType, pt := e.codec, e.dtmfType, e.payloadType
		e.mu.Unlock()
		if dtmfType >= 0 && int(p.PayloadType) == dtmfType {
			if digit, ok := e.dtmfEnd(&p); ok && h.DTMF != nil {
				h.DTMF(digit)
			}
			continue
		}
		if codec == nil || p.PayloadType != pt || h.Audio == nil {
			continue
		}
		h.Audio(codec.Decode(p.Payload))
	}
}

// dtmfEnd reports a digit once, on the first end packet of an RFC 4733 event.
func (e *Endpoint) dtmfEnd(p *rtp.Packet) (string, bool) {
	if len(p.Payload) < 4 || p.Payload[1]&0x80 == 0 {
		return "", false
	}
	e.mu.Lock()
	defer e.mu.Unlock()
	if p.Timestamp == e.lastEvent {
		return "", false // retransmitted end packet
	}
	e.lastEvent = p.Timestamp
	event := int(p.Payload[0])
	if event >= len(dtmfDigits) {
		return "", false
	}
	return string(dtmfDigits[event]), true
}

// Send writes one internal frame in the leg's codec.
func (e *Endpoint) Send(f audio.Frame) {
	e.mu.Lock()
	if e.closed || e.remote == nil || e.codec == nil {
		e.mu.Unlock()
		return
	}
	payload := e.codec.Encode(f)
	p := rtp.Packet{
		Header: rtp.Header{
			Version:        2,
			PayloadType:    e.payloadType,
			SequenceNumber: e.seq,
			Timestamp:      e.timestamp,
			SSRC:           e.SSRC,
		},
		Payload: payload,
	}
	e.seq++
	e.timestamp += uint32(e.codec.ClockRate() * audio.FrameMs / 1000)
	remote := e.remote
	e.mu.Unlock()
	if raw, err := p.Marshal(); err == nil {
		_, _ = e.conn.WriteToUDP(raw, remote)
	}
}

// SendDTMF sends one RFC 4733 event (used by the caller bot): start, middle, three ends.
func (e *Endpoint) SendDTMF(digit rune, dtmfType int) {
	event := -1
	for i, d := range dtmfDigits {
		if d == digit {
			event = i
		}
	}
	e.mu.Lock()
	remote := e.remote
	ts := e.timestamp
	e.mu.Unlock()
	if event < 0 || remote == nil {
		return
	}
	for i := 0; i < 5; i++ {
		end := i >= 2
		duration := uint16((i + 1) * 160)
		payload := []byte{byte(event), 10, byte(duration >> 8), byte(duration)}
		if end {
			payload[1] |= 0x80
		}
		e.mu.Lock()
		p := rtp.Packet{Header: rtp.Header{Version: 2, PayloadType: uint8(dtmfType), SequenceNumber: e.seq,
			Timestamp: ts, SSRC: e.SSRC, Marker: i == 0}, Payload: payload}
		e.seq++
		e.mu.Unlock()
		if raw, err := p.Marshal(); err == nil {
			_, _ = e.conn.WriteToUDP(raw, remote)
		}
		time.Sleep(20 * time.Millisecond)
	}
}

// Close stops Serve.
func (e *Endpoint) Close() {
	e.mu.Lock()
	e.closed = true
	e.mu.Unlock()
	_ = e.conn.Close()
}

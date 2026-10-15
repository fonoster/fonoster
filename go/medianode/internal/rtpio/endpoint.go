// Package rtpio is one RTP stream over UDP: receive with RFC 4733 DTMF detection, and send in
// the leg's codec, optionally as SRTP (SDES keys, AES_CM_128_HMAC_SHA1_80).
package rtpio

import (
	"math/rand"
	"net"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/pion/rtp"
	"github.com/pion/srtp/v3"
)

// Handlers receive decoded audio, raw audio packets and DTMF digits. When Packet is set it gets
// every audio packet in arrival order and Audio is not called (the node decodes after its jitter
// buffer); otherwise Audio gets each packet decoded on arrival.
type Handlers struct {
	Audio  func(audio.Frame)
	Packet func(*rtp.Packet)
	DTMF   func(digit string)
}

// Stats counts what an endpoint saw.
type Stats struct {
	Received    uint64 // audio packets accepted
	Sent        uint64
	Undecrypted uint64 // packets dropped because SRTP authentication failed (or they were plain)
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
	encrypt     *srtp.Context
	decrypt     *srtp.Context

	received, sent, undecrypted atomic.Uint64

	// Impair, when set, decides what happens to each outgoing packet (tests and the load
	// harness): it returns how many copies to send (0 drops it) and a delay before sending.
	Impair func() (copies int, delay time.Duration)
}

var dtmfDigits = "0123456789*#ABCD"

// DigitEvent is the RFC 4733 event code of a digit, or -1.
func DigitEvent(d rune) int {
	for i, c := range dtmfDigits {
		if c == d {
			return i
		}
	}
	return -1
}

// Listen binds a UDP port on host (0 picks one).
func Listen(host string) (*Endpoint, error) {
	conn, err := net.ListenUDP("udp4", &net.UDPAddr{IP: net.ParseIP(host)})
	if err != nil {
		return nil, err
	}
	_ = conn.SetReadBuffer(1 << 20)
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

// SetSRTP turns the stream into SRTP: local keys what this endpoint sends, remote what it
// receives (both base64 SDES inline keys). Plain RTP is dropped from then on.
func (e *Endpoint) SetSRTP(localKey, remoteKey string) error {
	enc, err := newContext(localKey)
	if err != nil {
		return err
	}
	dec, err := newContext(remoteKey)
	if err != nil {
		return err
	}
	e.mu.Lock()
	e.encrypt, e.decrypt = enc, dec
	e.mu.Unlock()
	return nil
}

// Secure reports whether the stream is SRTP.
func (e *Endpoint) Secure() bool {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.encrypt != nil
}

// Stats returns the endpoint's counters.
func (e *Endpoint) Stats() Stats {
	return Stats{Received: e.received.Load(), Sent: e.sent.Load(), Undecrypted: e.undecrypted.Load()}
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
	var plain []byte
	for {
		n, _, err := e.conn.ReadFromUDP(buf)
		if err != nil {
			return
		}
		data := buf[:n]
		e.mu.Lock()
		dec := e.decrypt
		e.mu.Unlock()
		if dec != nil {
			var hdr rtp.Header
			out, err := dec.DecryptRTP(plain[:0], data, &hdr)
			if err != nil {
				e.undecrypted.Add(1)
				continue
			}
			plain = out
			data = out
		}
		p := &rtp.Packet{}
		if err := p.Unmarshal(data); err != nil {
			continue
		}
		e.mu.Lock()
		e.lastPacket = time.Now()
		codec, dtmfType, pt := e.codec, e.dtmfType, e.payloadType
		e.mu.Unlock()
		if dtmfType >= 0 && int(p.PayloadType) == dtmfType {
			if digit, ok := e.dtmfEnd(p); ok && h.DTMF != nil {
				h.DTMF(digit)
			}
			continue
		}
		if codec == nil || p.PayloadType != pt {
			continue
		}
		e.received.Add(1)
		if h.Packet != nil {
			// Unmarshal aliases the read buffer; the jitter buffer keeps the payload.
			p.Payload = append([]byte(nil), p.Payload...)
			h.Packet(p)
			continue
		}
		if h.Audio != nil {
			h.Audio(codec.Decode(p.Payload))
		}
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
	raw, ok := e.marshalLocked(&p)
	remote := e.remote
	e.mu.Unlock()
	if ok {
		e.write(raw, remote)
	}
}

// marshalLocked serializes (and encrypts) a packet; e.mu must be held.
func (e *Endpoint) marshalLocked(p *rtp.Packet) ([]byte, bool) {
	raw, err := p.Marshal()
	if err != nil {
		return nil, false
	}
	if e.encrypt != nil {
		raw, err = e.encrypt.EncryptRTP(nil, raw, nil)
		if err != nil {
			return nil, false
		}
	}
	return raw, true
}

func (e *Endpoint) write(raw []byte, remote *net.UDPAddr) {
	copies, delay := 1, time.Duration(0)
	if e.Impair != nil {
		copies, delay = e.Impair()
	}
	if copies <= 0 {
		return
	}
	send := func() {
		for i := 0; i < copies; i++ {
			if _, err := e.conn.WriteToUDP(raw, remote); err == nil {
				e.sent.Add(1)
			}
		}
	}
	if delay > 0 {
		time.AfterFunc(delay, send)
		return
	}
	send()
}

// SendDTMF sends one RFC 4733 event (used by the caller bot and dtmf.send): start, middle, three
// ends. It holds the stream's timestamp so the event lines up with the audio around it.
func (e *Endpoint) SendDTMF(digit rune, dtmfType int) {
	event := DigitEvent(digit)
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
		raw, ok := e.marshalLocked(&p)
		e.mu.Unlock()
		if ok {
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

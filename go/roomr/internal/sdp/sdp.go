// Package sdp reads and writes the small subset of SDP the Roomr node needs: one audio stream,
// its address, codecs and telephone-event.
package sdp

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

// Media is the audio side of an offer or answer.
type Media struct {
	Host string
	Port int
	// PayloadTypes in offer order; Codecs maps them to "NAME/RATE".
	PayloadTypes []int
	Codecs       map[int]string
	// Fmtp holds each payload type's a=fmtp parameters as written ("useinbandfec=1;...").
	Fmtp map[int]string
	// DTMF is the telephone-event payload type, or -1.
	DTMF int
	// Secure is true for an RTP/SAVP stream; Crypto lists its SDES keys (RFC 4568).
	Secure bool
	Crypto []Crypto
}

// Crypto is one a=crypto line: tag, suite and the inline base64 key and salt.
type Crypto struct {
	Tag   int
	Suite string
	Key   string
}

// Parse reads the first audio stream.
func Parse(body []byte) (Media, error) {
	m := Media{Codecs: map[int]string{}, Fmtp: map[int]string{}, DTMF: -1}
	session := ""
	inAudio := false
	for _, raw := range strings.Split(string(body), "\n") {
		line := strings.TrimSpace(raw)
		switch {
		case strings.HasPrefix(line, "c=IN IP4 "):
			host := strings.TrimPrefix(line, "c=IN IP4 ")
			if inAudio {
				m.Host = host
			} else {
				session = host
			}
		case strings.HasPrefix(line, "m="):
			fields := strings.Fields(line[2:])
			inAudio = len(fields) >= 3 && fields[0] == "audio" && m.Port == 0
			if !inAudio {
				continue
			}
			port, err := strconv.Atoi(fields[1])
			if err != nil {
				return m, fmt.Errorf("bad audio port %q", fields[1])
			}
			m.Port = port
			m.Secure = strings.Contains(fields[2], "SAVP")
			for _, f := range fields[3:] {
				if pt, err := strconv.Atoi(f); err == nil {
					m.PayloadTypes = append(m.PayloadTypes, pt)
				}
			}
		case inAudio && strings.HasPrefix(line, "a=crypto:"):
			parts := strings.Fields(strings.TrimPrefix(line, "a=crypto:"))
			if len(parts) < 3 || !strings.HasPrefix(parts[2], "inline:") {
				continue
			}
			tag, _ := strconv.Atoi(parts[0])
			key := strings.TrimPrefix(parts[2], "inline:")
			if i := strings.Index(key, "|"); i >= 0 {
				key = key[:i] // lifetime and MKI are not used
			}
			m.Crypto = append(m.Crypto, Crypto{Tag: tag, Suite: parts[1], Key: key})
		case inAudio && strings.HasPrefix(line, "a=fmtp:"):
			rest := strings.TrimPrefix(line, "a=fmtp:")
			if i := strings.IndexByte(rest, ' '); i > 0 {
				if pt, err := strconv.Atoi(rest[:i]); err == nil {
					m.Fmtp[pt] = strings.TrimSpace(rest[i+1:])
				}
			}
		case inAudio && strings.HasPrefix(line, "a=rtpmap:"):
			rest := strings.TrimPrefix(line, "a=rtpmap:")
			parts := strings.Fields(rest)
			if len(parts) != 2 {
				continue
			}
			pt, err := strconv.Atoi(parts[0])
			if err != nil {
				continue
			}
			name := parts[1]
			if i := strings.LastIndex(name, "/"); i > 0 && strings.Count(name, "/") > 1 {
				name = name[:i] // drop channels
			}
			m.Codecs[pt] = name
			if strings.HasPrefix(strings.ToLower(name), "telephone-event/") {
				m.DTMF = pt
			}
		}
	}
	if m.Port == 0 {
		return m, fmt.Errorf("no audio stream")
	}
	if m.Host == "" {
		m.Host = session
	}
	// Static payload types may come without rtpmap.
	for _, pt := range m.PayloadTypes {
		if _, ok := m.Codecs[pt]; !ok {
			switch pt {
			case 0:
				m.Codecs[pt] = "PCMU/8000"
			case 8:
				m.Codecs[pt] = "PCMA/8000"
			case 9:
				m.Codecs[pt] = "G722/8000"
			}
		}
	}
	return m, nil
}

// Choose returns the first offered payload type whose codec is in supported: the remote's order
// wins. Use it on answers (the answerer has already picked) and where the peer's preference rules.
func (m Media) Choose(supported ...string) (int, string, bool) {
	for _, pt := range m.PayloadTypes {
		name := m.Codecs[pt]
		for _, s := range supported {
			if strings.EqualFold(name, s) {
				return pt, s, true
			}
		}
	}
	return 0, "", false
}

// ChoosePreferred returns the payload type of the first codec in supported (the node's order)
// that the remote offered, so an offer of PCMU and Opus is answered with Opus whatever its order
// (redesign-roomr, "Opus preferred when the peer accepts it"; RFC 3264 lets the answerer pick
// any offered codec).
func (m Media) ChoosePreferred(supported ...string) (int, string, bool) {
	for _, s := range supported {
		for _, pt := range m.PayloadTypes {
			if strings.EqualFold(m.Codecs[pt], s) {
				return pt, s, true
			}
		}
	}
	return 0, "", false
}

// OpusFmtp is the node's a=fmtp for Opus (RFC 7587): in-band FEC on, and the node mixes at
// 16 kHz, so it neither needs more than wideband from the peer nor sends more.
const OpusFmtp = "maxplaybackrate=16000;sprop-maxcapturerate=16000;useinbandfec=1"

// Codec is one payload type and its rtpmap name ("PCMU/8000", "opus/48000").
type Codec struct {
	PT   int
	Name string
}

// Description is one audio stream to offer or answer.
type Description struct {
	Host   string
	Port   int
	Codecs []Codec
	// DTMF is the telephone-event payload type, or -1 for none.
	DTMF int
	// Crypto, when set, makes the stream RTP/SAVP with this SDES key.
	Crypto *Crypto
}

// Write builds an offer or answer for one audio stream with one codec.
func Write(host string, port int, pt int, codec string, dtmf int) []byte {
	return WriteDescription(Description{Host: host, Port: port, Codecs: []Codec{{pt, codec}}, DTMF: dtmf})
}

// WriteDescription builds an offer or answer for one audio stream.
func WriteDescription(d Description) []byte {
	id := time.Now().UnixNano() / 1000
	pts := []string{}
	for _, c := range d.Codecs {
		pts = append(pts, strconv.Itoa(c.PT))
	}
	if d.DTMF >= 0 {
		pts = append(pts, strconv.Itoa(d.DTMF))
	}
	profile := "RTP/AVP"
	if d.Crypto != nil {
		profile = "RTP/SAVP"
	}
	lines := []string{
		"v=0",
		fmt.Sprintf("o=fonoster %d %d IN IP4 %s", id, id, d.Host),
		"s=fonoster",
		"c=IN IP4 " + d.Host,
		"t=0 0",
		fmt.Sprintf("m=audio %d %s %s", d.Port, profile, strings.Join(pts, " ")),
	}
	for _, c := range d.Codecs {
		name := c.Name
		if strings.EqualFold(name, "opus/48000") {
			name = "opus/48000/2"
		}
		lines = append(lines, fmt.Sprintf("a=rtpmap:%d %s", c.PT, name))
		if strings.HasPrefix(strings.ToLower(name), "opus/") {
			lines = append(lines, fmt.Sprintf("a=fmtp:%d %s", c.PT, OpusFmtp))
		}
	}
	if d.DTMF >= 0 {
		lines = append(lines,
			fmt.Sprintf("a=rtpmap:%d telephone-event/8000", d.DTMF),
			fmt.Sprintf("a=fmtp:%d 0-16", d.DTMF))
	}
	if d.Crypto != nil {
		tag := d.Crypto.Tag
		if tag == 0 {
			tag = 1
		}
		lines = append(lines, fmt.Sprintf("a=crypto:%d %s inline:%s", tag, d.Crypto.Suite, d.Crypto.Key))
	}
	lines = append(lines, "a=ptime:20", "a=sendrecv")
	return []byte(strings.Join(lines, "\r\n") + "\r\n")
}

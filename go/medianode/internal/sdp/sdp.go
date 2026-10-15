// Package sdp reads and writes the small subset of SDP the media node needs: one audio stream,
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
	// DTMF is the telephone-event payload type, or -1.
	DTMF int
}

// Parse reads the first audio stream.
func Parse(body []byte) (Media, error) {
	m := Media{Codecs: map[int]string{}, DTMF: -1}
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
			for _, f := range fields[3:] {
				if pt, err := strconv.Atoi(f); err == nil {
					m.PayloadTypes = append(m.PayloadTypes, pt)
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

// Choose returns the first offered payload type whose codec is in supported.
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

// Write builds an offer or answer for one audio stream.
func Write(host string, port int, pt int, codec string, dtmf int) []byte {
	id := time.Now().UnixNano() / 1000
	pts := strconv.Itoa(pt)
	if dtmf >= 0 {
		pts += " " + strconv.Itoa(dtmf)
	}
	lines := []string{
		"v=0",
		fmt.Sprintf("o=fonoster %d %d IN IP4 %s", id, id, host),
		"s=fonoster",
		"c=IN IP4 " + host,
		"t=0 0",
		fmt.Sprintf("m=audio %d RTP/AVP %s", port, pts),
		fmt.Sprintf("a=rtpmap:%d %s", pt, codec),
	}
	if dtmf >= 0 {
		lines = append(lines,
			fmt.Sprintf("a=rtpmap:%d telephone-event/8000", dtmf),
			fmt.Sprintf("a=fmtp:%d 0-16", dtmf))
	}
	lines = append(lines, "a=ptime:20", "a=sendrecv")
	return []byte(strings.Join(lines, "\r\n") + "\r\n")
}

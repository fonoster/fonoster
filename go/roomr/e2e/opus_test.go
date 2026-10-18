package e2e

// Opus first (redesign-roomr task 8): an Opus-capable caller negotiates Opus and carries
// wideband audio both ways; a G.711-only peer still gets PCMU; the node's own INVITEs offer
// opus/48000/2, G.722, PCMU, PCMA and the callee's pick wins.

import (
	"strconv"
	"testing"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/caller"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
)

func needOpus(t *testing.T) {
	t.Helper()
	if !audio.OpusAvailable {
		t.Skip("built without libopus (cgo off)")
	}
}

// bothWays checks freq from the caller reaches the session participant and the participant's
// audio reaches the caller.
func bothWays(t *testing.T, call *caller.Call, g *gateway, freq float64) {
	t.Helper()
	call.Speak("tone:"+strconv.FormatFloat(freq, 'f', -1, 64), 600)
	time.Sleep(900 * time.Millisecond)
	if got := g.m.get(freq); got < 15 {
		t.Fatalf("session participant heard %d frames of the caller's %.0f Hz tone", got, freq)
	}
	before := call.Status().AudibleMs
	g.play(1000, 500)
	time.Sleep(200 * time.Millisecond)
	if got := call.Status().AudibleMs - before; got < 300 {
		t.Fatalf("caller heard %d ms of the session participant", got)
	}
}

func TestOpusPreferredWhenOffered(t *testing.T) {
	needOpus(t)
	r := start(t)
	// PCMU listed first: the node still answers with Opus, its first choice.
	call, room, g := r.answeredCallWith(caller.DialOptions{Codecs: []string{audio.NamePCMU, "opus/48000"}}, "")
	if s := call.Status(); s.Codec != audio.NameOpus {
		t.Fatalf("answered with %q, want Opus", s.Codec)
	}
	// 6 kHz is above G.711's band: it only arrives because the leg is wideband.
	bothWays(t, call, g, 6000)
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
}

func TestG711OnlyCallerGetsPCMU(t *testing.T) {
	r := start(t)
	call, room, g := r.answeredCallWith(caller.DialOptions{Codecs: []string{audio.NamePCMA, audio.NamePCMU}}, "")
	if s := call.Status(); s.Codec != audio.NamePCMU {
		t.Fatalf("answered with %q, want PCMU (the node's order among what was offered)", s.Codec)
	}
	bothWays(t, call, g, 1000)
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
}

func TestOpusDisabledByConfig(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) { c.Codecs = []string{audio.NamePCMU, audio.NamePCMA} }})
	call, room, _ := r.answeredCallWith(caller.DialOptions{Codecs: []string{"opus/48000", audio.NamePCMA}}, "")
	if s := call.Status(); s.Codec != audio.NamePCMA {
		t.Fatalf("answered with %q, want PCMA with Opus disabled", s.Codec)
	}
	_ = call.Hangup()
	r.waitEvent(typed("room.ended", "roomRef", room), 3*time.Second)
}

// dialed dials the callee bot into a room with a session participant and returns both.
func (r *rig) dialed(id string) (*caller.Call, *gateway, string) {
	room := r.command(map[string]any{"type": "room.create", "id": "c-" + id})["roomRef"].(string)
	g, rep := r.addSession(room, "")
	if rep["type"] != "ack" {
		r.t.Fatalf("participant.add: %v", rep)
	}
	r.command(map[string]any{"type": "participant.dial", "id": id, "roomRef": room, "to": "+15551234567"})
	r.waitEvent(typed("participant.joined", "id", id), 3*time.Second)
	return r.calleeCall(), g, room
}

func TestDialNegotiatesTheCalleesPick(t *testing.T) {
	t.Run("opus-capable callee", func(t *testing.T) {
		needOpus(t)
		r := start(t)
		callee, g, _ := r.dialed("d-opus")
		if s := callee.Status(); s.Codec != audio.NameOpus {
			t.Fatalf("callee answered %q; the node offers Opus first", s.Codec)
		}
		bothWays(t, callee, g, 6000)
	})
	t.Run("G.711-only callee", func(t *testing.T) {
		r := start(t)
		r.callee.AnswerCodecs(audio.NamePCMU)
		callee, g, _ := r.dialed("d-pcmu")
		if s := callee.Status(); s.Codec != audio.NamePCMU {
			t.Fatalf("callee answered %q, want PCMU", s.Codec)
		}
		bothWays(t, callee, g, 1000)
	})
}

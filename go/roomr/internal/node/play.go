package node

import (
	"net/url"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
)

// playback is one Play operation: frames mixed into what its target hears (every participant
// when target is ""), one per room tick.
type playback struct {
	ref  string
	room *Room
	// target is the participant that hears it ("" for the whole room).
	target string
	frames []audio.Frame
	pos    int
	loop   bool
	// origin is the call whose app started the operation: operation.done goes on its control
	// stream only. Nil for a controller's operation, reported on NATS: on callRef's subject when
	// it targets a call, else on the room's.
	origin  *call
	callRef string
}

// Operation statuses (operation.done).
const (
	OpCompleted = "completed"
	OpFailed    = "failed"
	OpStopped   = "stopped"
)

func validPlayURL(s string) bool {
	u, err := url.Parse(s)
	return err == nil && (u.Scheme == "http" || u.Scheme == "https") && u.Host != ""
}

// startPlay registers the operation, then fetches the file (as given: tenant URLs are checked
// upstream) and starts it on the room's clock.
func (n *Node) startPlay(pb *playback, fileURL string) error {
	n.mu.Lock()
	if _, taken := n.ops[pb.ref]; taken {
		n.mu.Unlock()
		return errorf(CodeOperationExists, "%s", pb.ref)
	}
	n.ops[pb.ref] = pb
	n.mu.Unlock()
	go func() {
		frames, err := n.fetchWav(fileURL)
		if err != nil {
			n.cfg.Logger.Warn("play", "url", fileURL, "err", err)
			n.opDone(pb, OpFailed, err.Error())
			return
		}
		r := pb.room
		r.mu.Lock()
		if r.ended {
			r.mu.Unlock()
			n.opDone(pb, OpStopped, "")
			return
		}
		n.mu.Lock()
		_, live := n.ops[pb.ref]
		n.mu.Unlock()
		if live && len(frames) > 0 {
			pb.frames = frames
			r.plays = append(r.plays, pb)
		}
		r.mu.Unlock()
		if live && len(frames) == 0 {
			n.opDone(pb, OpCompleted, "")
		}
	}()
	return nil
}

// stopPlay cancels a Play; its operation.done reports stopped.
func (n *Node) stopPlay(ref string) error {
	n.mu.Lock()
	pb := n.ops[ref]
	n.mu.Unlock()
	if pb == nil {
		return errorf(CodeOperationNotFound, "%s", ref)
	}
	r := pb.room
	r.mu.Lock()
	for i, p := range r.plays {
		if p == pb {
			r.plays = append(r.plays[:i], r.plays[i+1:]...)
			break
		}
	}
	r.mu.Unlock()
	n.opDone(pb, OpStopped, "")
	return nil
}

// opDone reports an operation's end once, on its one channel.
func (n *Node) opDone(pb *playback, status, errText string) {
	n.mu.Lock()
	if n.ops[pb.ref] != pb {
		n.mu.Unlock()
		return
	}
	delete(n.ops, pb.ref)
	var c *call
	if pb.origin == nil && pb.callRef != "" {
		c = n.calls[pb.callRef]
	}
	n.mu.Unlock()
	if pb.origin != nil {
		pb.origin.streamOpDone(pb.ref, status, errText)
		return
	}
	ev := Event{"operation_ref": pb.ref, "status": status}
	if errText != "" {
		ev["error"] = errText
	}
	if c != nil && c.event("operation.done", ev) {
		return
	}
	pb.room.event("operation.done", ev)
}

// nextPlayFrames advances every playback by one frame (r.mu held) and returns this tick's
// frames and the playbacks that just finished.
func (r *Room) nextPlayFrames() (map[*playback]audio.Frame, []*playback) {
	if len(r.plays) == 0 {
		return nil, nil
	}
	out := make(map[*playback]audio.Frame, len(r.plays))
	var done []*playback
	keep := r.plays[:0]
	for _, pb := range r.plays {
		if pb.pos >= len(pb.frames) {
			if !pb.loop || len(pb.frames) == 0 {
				done = append(done, pb)
				continue
			}
			pb.pos = 0
		}
		out[pb] = pb.frames[pb.pos]
		pb.pos++
		keep = append(keep, pb)
	}
	r.plays = keep
	return out, done
}

// playsFor appends the playback frames a participant hears to its mix.
func playsFor(ref string, plays map[*playback]audio.Frame, mix []audio.Frame) []audio.Frame {
	for pb, f := range plays {
		if pb.target == "" || pb.target == ref {
			mix = append(mix, f)
		}
	}
	return mix
}

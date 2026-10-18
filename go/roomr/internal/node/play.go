package node

import "github.com/fonoster/fonoster/go/roomr/internal/audio"

// playback is one Play: frames mixed into what its target hears (every participant when target
// is ""), one per room tick.
type playback struct {
	ref    string
	target string
	frames []audio.Frame
	pos    int
}

// Operation statuses (operation.done).
const (
	OpCompleted = "completed"
	OpFailed    = "failed"
	OpStopped   = "stopped"
)

// play fetches the file with the node's HTTP client (the one hold music uses) and
// starts it on the room's clock.
func (r *Room) play(ref, target, fileURL string) {
	frames, err := r.node.fetchWav(fileURL)
	if err != nil {
		r.node.cfg.Logger.Warn("play", "url", fileURL, "err", err)
		r.node.emit(r.Ref, Event{"type": "operation.done", "operationRef": ref, "status": OpFailed, "error": err.Error()})
		return
	}
	r.mu.Lock()
	if r.ended {
		r.mu.Unlock()
		r.node.emit(r.Ref, Event{"type": "operation.done", "operationRef": ref, "status": OpStopped})
		return
	}
	r.plays = append(r.plays, &playback{ref: ref, target: target, frames: frames})
	r.mu.Unlock()
}

// nextPlayFrames advances every playback by one frame (r.mu held) and returns this tick's
// frames and the refs of playbacks that just finished.
func (r *Room) nextPlayFrames() (map[*playback]audio.Frame, []string) {
	if len(r.plays) == 0 {
		return nil, nil
	}
	out := make(map[*playback]audio.Frame, len(r.plays))
	var done []string
	keep := r.plays[:0]
	for _, pb := range r.plays {
		if pb.pos >= len(pb.frames) {
			done = append(done, pb.ref)
			continue
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

func (r *Room) playsDone(refs []string, status string) {
	for _, ref := range refs {
		r.node.emit(r.Ref, Event{"type": "operation.done", "operationRef": ref, "status": status})
	}
}

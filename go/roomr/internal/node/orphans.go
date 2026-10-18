package node

import (
	"encoding/json"
	"sync"
	"time"

	"github.com/nats-io/nats.go"
)

// GatewayHeartbeatSubject is where gateway replicas announce themselves every 5 s
// ({type: "gateway.heartbeat", gatewayRef, calls}).
const GatewayHeartbeatSubject = "gateway.heartbeat"

// Orphan rooms (roomr "Rooms without an owner end"): a room whose owner is gone holds a
// MaxRooms slot and, for an answered call, leaves the caller in dead air until MaxDuration. Two
// owners can go away: the control-plane replica that sent room.create (before anyone joins), and
// the gateway that claimed or will own the call.

// orphanState is a room's view of its owner. Guarded by the room's mu.
type orphanState struct {
	// owner is the gateway that owns the call (the claim reply's gatewayRef, or a command's).
	owner string
	// dialing counts participant.dial attempts in progress; idleSince is when the room was
	// created or its last dial ended.
	dialing   int
	idleSince time.Time
}

// gatewayWatch is when the node last heard each gateway's heartbeat.
type gatewayWatch struct {
	mu   sync.Mutex
	seen map[string]time.Time
}

func (w *gatewayWatch) note(ref string, at time.Time, keep time.Duration) {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.seen == nil {
		w.seen = map[string]time.Time{}
	}
	w.seen[ref] = at
	for r, t := range w.seen {
		if at.Sub(t) > keep {
			delete(w.seen, r)
		}
	}
}

func (w *gatewayWatch) lastSeen(ref string) (time.Time, bool) {
	w.mu.Lock()
	defer w.mu.Unlock()
	t, ok := w.seen[ref]
	return t, ok
}

// watchGateways follows gateway heartbeats. Without permission to subscribe (or before any
// heartbeat), owners are never judged gone: only a gateway the node has heard and then lost ends
// its rooms.
func (n *Node) watchGateways() {
	if n.cfg.OwnerTimeout < 0 {
		return
	}
	keep := 3 * n.cfg.OwnerTimeout
	if keep < time.Minute {
		keep = time.Minute
	}
	sub, err := n.nc.Subscribe(GatewayHeartbeatSubject, func(m *nats.Msg) {
		var hb struct {
			GatewayRef string `json:"gatewayRef"`
		}
		if json.Unmarshal(m.Data, &hb) == nil && hb.GatewayRef != "" {
			n.gateways.note(hb.GatewayRef, time.Now(), keep)
		}
	})
	if err != nil {
		n.cfg.Logger.Warn("gateway heartbeats unavailable; rooms are not ended when their gateway is lost", "err", err)
		return
	}
	n.subs = append(n.subs, sub)
}

// setOwner records the gateway that owns the room ("" changes nothing).
func (r *Room) setOwner(gatewayRef string) {
	if gatewayRef == "" {
		return
	}
	r.mu.Lock()
	r.orphan.owner = gatewayRef
	r.mu.Unlock()
}

// dialStarted and dialEnded bracket a participant.dial: a room waiting on a dial is not empty.
func (r *Room) dialStarted() {
	r.mu.Lock()
	r.orphan.dialing++
	r.mu.Unlock()
}

// dialEnded reports whether the room is now empty with no other dial in progress.
func (r *Room) dialEnded() (empty bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.orphan.dialing--
	r.orphan.idleSince = time.Now()
	return r.orphan.dialing == 0 && len(r.participants) == 0
}

// orphaned reports why the room has no owner left ("" when it has one).
func (r *Room) orphaned() string {
	cfg := r.node.cfg
	r.mu.Lock()
	empty := len(r.participants) == 0 && r.orphan.dialing == 0
	idle := time.Since(r.orphan.idleSince)
	owner := r.orphan.owner
	emptyTimeout := r.emptyTimeout
	r.mu.Unlock()
	if empty && emptyTimeout > 0 && idle > emptyTimeout {
		return "empty"
	}
	if owner != "" && cfg.OwnerTimeout > 0 {
		if at, ok := r.node.gateways.lastSeen(owner); ok && time.Since(at) > cfg.OwnerTimeout {
			return "gateway " + owner + " lost"
		}
	}
	return ""
}

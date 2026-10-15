package node

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fonoster/fonoster/go/medianode/internal/audio"
	"github.com/fonoster/fonoster/go/medianode/internal/jitter"
	"github.com/fonoster/fonoster/go/medianode/internal/telemetry"

	"github.com/fonoster/fonoster/go/medianode/internal/netguard"
	"github.com/nats-io/nats.go"
)

// IncomingSubject is where calls are offered to the gateway replicas (media-control, "Incoming
// calls are claimed by exactly one gateway replica").
const IncomingSubject = "gateway.incoming"

// Config is the node's runtime configuration.
type Config struct {
	NodeID string
	// RTPHost is the address RTP sockets bind to; AdvertiseHost is what SDP and rtp blocks carry.
	RTPHost       string
	AdvertiseHost string
	// ClaimTimeout is how long a gateway has to claim a call (500 ms; one retry).
	ClaimTimeout time.Duration
	// Heartbeat is the node.heartbeat period (2 s).
	Heartbeat time.Duration
	// MediaTimeout ends an answered call with no caller RTP (30 s).
	MediaTimeout time.Duration
	// MaxDuration ends any call that runs this long (4 h).
	MaxDuration time.Duration
	// MaxParticipants per room (10).
	MaxParticipants int
	// RequireEncryption refuses plain RTP on every leg (MN6): SIP legs must offer RTP/SAVP with
	// an SDES key, and the gateway's rtp blocks must carry srtp.
	RequireEncryption bool
	// AllowedDestinations are private hosts, IPs or CIDRs hold music may come from
	// (FONOSTER_ALLOWED_DESTINATIONS); everything else must be public (RV-B2).
	AllowedDestinations []string
	Logger              *slog.Logger
}

func (c *Config) defaults() {
	if c.RTPHost == "" {
		c.RTPHost = "127.0.0.1"
	}
	if c.AdvertiseHost == "" {
		c.AdvertiseHost = c.RTPHost
	}
	if c.ClaimTimeout == 0 {
		c.ClaimTimeout = 500 * time.Millisecond
	}
	if c.Heartbeat == 0 {
		c.Heartbeat = 2 * time.Second
	}
	if c.MediaTimeout == 0 {
		c.MediaTimeout = 30 * time.Second
	}
	if c.MaxDuration == 0 {
		c.MaxDuration = 4 * time.Hour
	}
	if c.MaxParticipants == 0 {
		c.MaxParticipants = 10
	}
	if c.Logger == nil {
		c.Logger = slog.Default()
	}
}

// Node owns rooms and serves media-control over NATS.
type Node struct {
	cfg      Config
	guard    *netguard.Guard
	music    *http.Client
	nc       *nats.Conn
	mu       sync.Mutex
	rooms    map[string]*Room
	seq      int
	draining bool
	subs     []*nats.Subscription
	stop     chan struct{}
	dialer   Dialer

	// Counters for the load harness (GET /stats on the debug endpoint).
	framesMixed, lateTicks, missedTicks, dtmfReported atomic.Uint64
	endedStats                                        jitter.Stats
	// OnDrain is told when the node starts draining (Routr registration reports it full).
	OnDrain func()
	// OnRoomCount is told the number of active rooms whenever it changes (Routr registration).
	OnRoomCount func(n int)
}

// New creates a node; Start connects it to media-control.
func New(nc *nats.Conn, cfg Config) *Node {
	cfg.defaults()
	guard := netguard.New(cfg.AllowedDestinations)
	return &Node{cfg: cfg, nc: nc, rooms: map[string]*Room{}, stop: make(chan struct{}),
		guard: guard, music: guard.Client(10 * time.Second)}
}

// SetDialer gives the node a way to place outbound legs (participant.dial, transfers).
func (n *Node) SetDialer(d Dialer) { n.dialer = d }

// Held reports whether a room has a participant on hold (tests and debugging).
func (n *Node) Held(roomRef string) bool {
	if r := n.room(roomRef); r != nil {
		return r.isHeld()
	}
	return false
}

// RoomState is a debug view of one room.
type RoomState struct {
	RoomRef      string   `json:"roomRef"`
	Held         bool     `json:"held"`
	Participants []string `json:"participants"`
}

// Rooms lists active rooms (the debug endpoint; not part of media-control).
func (n *Node) Rooms() []RoomState {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	n.mu.Unlock()
	out := make([]RoomState, 0, len(rooms))
	for _, r := range rooms {
		r.mu.Lock()
		out = append(out, RoomState{RoomRef: r.Ref, Held: r.heldRef != "", Participants: append([]string(nil), r.order...)})
		r.mu.Unlock()
	}
	return out
}

// ID is the node id used in every subject.
func (n *Node) ID() string { return n.cfg.NodeID }

// Start serves commands and publishes heartbeats.
func (n *Node) Start() error {
	sub, err := n.nc.Subscribe(fmt.Sprintf("media.%s.commands", n.cfg.NodeID), func(m *nats.Msg) {
		reply := n.handleRaw(m.Data)
		data, _ := json.Marshal(reply)
		_ = m.Respond(data)
	})
	if err != nil {
		return err
	}
	n.subs = append(n.subs, sub)
	go n.heartbeats()
	return n.nc.Flush()
}

// Drain stops taking new rooms and reports the node full (MN9); existing rooms keep running.
func (n *Node) Drain() {
	n.mu.Lock()
	n.draining = true
	n.mu.Unlock()
	n.beat()
	if n.OnDrain != nil {
		n.OnDrain()
	}
}

// DrainAndWait drains and returns when the last room has ended, or ends the rooms still up after
// maxWait with node_error (their apps get session.end reason "error"). Stop cuts the wait short.
// It returns the number of rooms it had to end.
func (n *Node) DrainAndWait(maxWait time.Duration, stop <-chan struct{}) int {
	n.Drain()
	deadline := time.NewTimer(maxWait)
	defer deadline.Stop()
	poll := time.NewTicker(100 * time.Millisecond)
	defer poll.Stop()
	for n.ActiveRooms() > 0 {
		select {
		case <-deadline.C:
			return n.endAll(ReasonNodeError)
		case <-stop:
			return n.endAll(ReasonNodeError)
		case <-poll.C:
		}
	}
	return 0
}

func (n *Node) endAll(reason string) int {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	n.mu.Unlock()
	for _, r := range rooms {
		r.hangupAll(reason, 0, "")
	}
	return len(rooms)
}

// Stats is what the load harness reads: frames mixed, clock stalls, jitter buffer counters and
// keypresses reported.
type Stats struct {
	Rooms        int          `json:"rooms"`
	FramesMixed  uint64       `json:"framesMixed"`
	LateTicks    uint64       `json:"lateTicks"`
	MissedTicks  uint64       `json:"missedTicks"`
	DTMFReported uint64       `json:"dtmfReported"`
	Jitter       jitter.Stats `json:"jitter"`
	// DroppedFrames is every frame lost inside the node: missed clock ticks plus frames the jitter
	// buffers discarded (late, overflow) or had to conceal (lost on the way in).
	DroppedFrames uint64 `json:"droppedFrames"`
}

// Stats sums the node's counters, including rooms that already ended.
func (n *Node) Stats() Stats {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	js := n.endedStats
	n.mu.Unlock()
	for _, r := range rooms {
		js = js.Add(r.jitterStats())
	}
	s := Stats{Rooms: len(rooms), FramesMixed: n.framesMixed.Load(), LateTicks: n.lateTicks.Load(),
		MissedTicks: n.missedTicks.Load(), DTMFReported: n.dtmfReported.Load(), Jitter: js}
	s.DroppedFrames = s.MissedTicks + js.Dropped()
	return s
}

// ActiveRooms counts rooms that have not ended.
func (n *Node) ActiveRooms() int {
	n.mu.Lock()
	defer n.mu.Unlock()
	return len(n.rooms)
}

// Draining reports whether the node takes new rooms.
func (n *Node) Draining() bool {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.draining
}

// Shutdown ends every room and publishes node.down.
func (n *Node) Shutdown() {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	n.mu.Unlock()
	for _, r := range rooms {
		r.hangupAll(ReasonNodeError, 0, "")
	}
	close(n.stop)
	for _, s := range n.subs {
		_ = s.Unsubscribe()
	}
	n.publish(fmt.Sprintf("media.%s.heartbeat", n.cfg.NodeID), Event{"type": "node.down", "nodeId": n.cfg.NodeID})
	_ = n.nc.Flush()
}

func (n *Node) heartbeats() {
	t := time.NewTicker(n.cfg.Heartbeat)
	defer t.Stop()
	n.beat()
	for {
		select {
		case <-n.stop:
			return
		case <-t.C:
			n.beat()
		}
	}
}

func (n *Node) beat() {
	n.mu.Lock()
	ev := Event{"type": "node.heartbeat", "nodeId": n.cfg.NodeID, "rooms": len(n.rooms), "draining": n.draining}
	n.mu.Unlock()
	n.publish(fmt.Sprintf("media.%s.heartbeat", n.cfg.NodeID), ev)
}

func (n *Node) publish(subject string, ev Event) {
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	_ = n.nc.Publish(subject, data)
}

func (n *Node) emit(roomRef string, ev Event) {
	ev["roomRef"] = roomRef
	n.publish(fmt.Sprintf("media.%s.events.%s", n.cfg.NodeID, roomRef), ev)
}

func (n *Node) nextRef(prefix string) string {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.seq++
	return fmt.Sprintf("%s-%s-%d-%d", prefix, n.cfg.NodeID, time.Now().UnixNano()%1_000_000, n.seq)
}

func (n *Node) newRoom() (*Room, error) {
	n.mu.Lock()
	if n.draining {
		n.mu.Unlock()
		return nil, fmt.Errorf("draining")
	}
	n.mu.Unlock()
	r := newRoom(n, n.nextRef("room"))
	n.mu.Lock()
	n.rooms[r.Ref] = r
	count := len(n.rooms)
	n.mu.Unlock()
	if n.OnRoomCount != nil {
		n.OnRoomCount(count)
	}
	go r.run()
	return r, nil
}

func (n *Node) roomEnded(r *Room) {
	st := r.jitterStats()
	n.mu.Lock()
	n.endedStats = n.endedStats.Add(st)
	delete(n.rooms, r.Ref)
	count := len(n.rooms)
	n.mu.Unlock()
	if n.OnRoomCount != nil {
		n.OnRoomCount(count)
	}
}

func (n *Node) room(ref string) *Room {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.rooms[ref]
}

// Incoming handles an INVITE: a room with the caller, then call.incoming until a gateway claims
// it; no claim within the timeout, twice, refuses the call with 503.
func (n *Node) Incoming(call IncomingCall) {
	ctx, endSpan := telemetry.StartCall(context.Background(), "medianode.call.incoming", call.CallRef)
	defer endSpan()
	if _, _, ok := call.Media.Choose(audio.PhoneCodecs()...); !ok {
		_ = call.Leg.Reject(488)
		return
	}
	if n.cfg.RequireEncryption && !call.Media.Secure {
		_ = call.Leg.Reject(488)
		return
	}
	room, err := n.newRoom()
	if err != nil {
		_ = call.Leg.Reject(503)
		return
	}
	caller, status, err := room.addPhone(call)
	if err != nil {
		n.cfg.Logger.Warn("caller leg", "err", err, "status", status)
		_ = call.Leg.Reject(status)
		room.end(ReasonRejected, status, "")
		return
	}
	if call.OnRoom != nil {
		call.OnRoom(room.Ref)
	}
	if n.Draining() {
		// Drain began while the room was set up.
		_ = call.Leg.Reject(503)
		room.end(ReasonNodeError, 503, "")
		return
	}
	ev := Event{
		"type":           "call.incoming",
		"id":             n.nextRef("in"),
		"nodeId":         n.cfg.NodeID,
		"roomRef":        room.Ref,
		"participantRef": caller.Ref,
		"participant":    Event{"participantRef": caller.Ref, "tracks": caller.tracks()},
		"direction":      orDefault(call.Direction, "inbound"),
		"from":           call.From,
		"to":             call.To,
		"callerName":     call.CallerName,
		"headers":        call.Headers,
		"metadata":       map[string]any{},
	}
	if call.AppRef != "" {
		ev["appRef"] = call.AppRef
	}
	if call.CallRef != "" {
		ev["callRef"] = call.CallRef
	}
	data, _ := json.Marshal(ev)
	for attempt := 0; attempt < 2; attempt++ {
		msg, err := n.nc.Request(IncomingSubject, data, n.cfg.ClaimTimeout)
		if err != nil {
			continue
		}
		var reply map[string]any
		if json.Unmarshal(msg.Data, &reply) == nil && reply["type"] == "claimed" {
			telemetry.CallIncoming(ctx, call.CallRef, "claimed")
			return
		}
	}
	telemetry.CallIncoming(ctx, call.CallRef, "unclaimed")
	n.cfg.Logger.Warn("no gateway claimed the call", "room", room.Ref, telemetry.CallRefKey, call.CallRef)
	_ = call.Leg.Reject(503)
	room.end(ReasonNodeError, 503, "")
	n.publishCallFailed(orDefault(call.CallRef, room.Ref), call, ReasonNodeError)
}

// CallerGone is a BYE or CANCEL from the caller.
func (n *Node) CallerGone(roomRef string) {
	if r := n.room(roomRef); r != nil {
		r.callerHungUp()
	}
}

func orDefault(s, d string) string {
	if s == "" {
		return d
	}
	return s
}

// ---- media-control -------------------------------------------------------------------------

func (n *Node) handleRaw(data []byte) Command {
	var cmd Command
	if err := json.Unmarshal(data, &cmd); err != nil {
		return Command{"type": "error", "id": "", "code": "bad_message"}
	}
	return n.Handle(context.Background(), cmd)
}

var knownCommands = map[string]bool{
	"ring": true, "answer": true, "room.create": true, "participant.add": true,
	"participant.dial": true, "participant.remove": true, "transfer": true,
	"transfer.complete": true, "hold": true, "resume": true, "dtmf.send": true,
	"listener.attach": true, "listener.detach": true, "room.end": true, "hangup": true,
}

// Handle runs one command and returns its reply.
func (n *Node) Handle(_ context.Context, cmd Command) Command {
	id, _ := cmd["id"].(string)
	typ, _ := cmd["type"].(string)
	ack := func(extra Command) Command {
		out := Command{"type": "ack", "id": id}
		for k, v := range extra {
			out[k] = v
		}
		return out
	}
	fail := func(code, message string) Command {
		out := Command{"type": "error", "id": id, "code": code}
		if message != "" {
			out["message"] = message
		}
		return out
	}
	if !knownCommands[typ] {
		return fail("unknown_command", typ)
	}
	if typ == "room.create" {
		r, err := n.newRoom()
		if err != nil {
			return fail("draining", "")
		}
		r.setMaxDuration(cmd)
		return ack(Command{"roomRef": r.Ref})
	}
	roomRef, _ := cmd["roomRef"].(string)
	r := n.room(roomRef)
	if r == nil {
		return fail("room_not_found", roomRef)
	}
	switch typ {
	case "ring":
		if err := r.ring(); err != nil {
			return fail("sip_error", err.Error())
		}
		return ack(nil)
	case "answer":
		r.setMaxDuration(cmd)
		if err := r.answer(); err != nil {
			return fail("sip_error", err.Error())
		}
		return ack(nil)
	case "participant.add":
		return r.addSession(cmd, ack, fail)
	case "participant.remove":
		ref, _ := cmd["participantRef"].(string)
		if !r.remove(ref, id, ReasonRemoved) {
			return fail("participant_not_found", ref)
		}
		return ack(nil)
	case "hold", "resume":
		music, _ := cmd["music"].(string)
		r.setHold(typ == "hold", music)
		return ack(nil)
	case "dtmf.send":
		digits, _ := cmd["digits"].(string)
		go r.sendDTMF(digits)
		return ack(nil)
	case "hangup", "room.end":
		status := 0
		if s, ok := cmd["sipStatus"].(float64); ok {
			status = int(s)
		}
		reason := ReasonRemoved
		if status != 0 {
			reason = ReasonRejected
		}
		go r.hangupAll(reason, status, id)
		return ack(nil)
	case "participant.dial":
		if n.dialer == nil {
			return fail("not_supported", "no outbound proxy configured")
		}
		go r.dial(cmd)
		return ack(nil)
	case "transfer":
		if n.dialer == nil {
			if mode, _ := cmd["mode"].(string); mode != "refer" {
				return fail("not_supported", "no outbound proxy configured")
			}
		}
		go r.transfer(cmd)
		return ack(nil)
	case "transfer.complete":
		go r.completeTransfer(id)
		return ack(nil)
	case "listener.attach":
		return r.attachListener(cmd, ack, fail)
	case "listener.detach":
		ref, _ := cmd["listenerRef"].(string)
		if !r.detachListener(ref) {
			return fail("listener_not_found", ref)
		}
		return ack(nil)
	default:
		return fail("unknown_command", typ)
	}
}

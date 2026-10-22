package node

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/nats-io/nats.go"
)

// DefaultMaxRooms is the room limit when none is configured (roomr "Call and room limits").
const DefaultMaxRooms = 200

// CallDedupeWindow is how long a call_ref is remembered, ended calls included: a repeated
// CreateCall for it returns the call instead of dialing again (a constant, not a setting).
const CallDedupeWindow = 10 * time.Minute

// Config is the node's runtime configuration.
type Config struct {
	NodeID string
	// RTPHost is the address RTP sockets bind to; AdvertiseHost is the address SDP and the
	// control stream's MediaEndpoint announce (default RTPHost).
	RTPHost       string
	AdvertiseHost string
	// Heartbeat is the node.heartbeat period (2 s).
	Heartbeat time.Duration
	// MediaTimeout ends an answered call whose caller or app leg sent no RTP for this long
	// (15 s): media_timeout for the caller's leg, app_gone for the app's.
	MediaTimeout time.Duration
	// MaxDuration ends any call that runs this long (4 h); CreateCall and Answer can lower it.
	MaxDuration time.Duration
	// MaxParticipants per room (10); CreateRoom can override it per room.
	MaxParticipants int
	// MaxRooms is the most rooms the node holds at once (200). INVITEs beyond it get 503 and
	// CreateCall RESOURCE_EXHAUSTED; heartbeats report it.
	MaxRooms int
	Logger   *slog.Logger
	// EmptyRoomTimeout ends a room with no participant and no CreateCall in progress for this
	// long (30 s; negative disables) with cause node_error. CreateRoom can override it.
	EmptyRoomTimeout time.Duration
	// AnswerTimeout is how long the app has to send Answer or Reject on an inbound call before
	// the caller gets 480 (10 s).
	AnswerTimeout time.Duration
	// ReadyTimeout is how long the app has to send Ready on an answered outbound call before
	// the node hangs up with app_gone (10 s).
	ReadyTimeout time.Duration
	// SessionEndpoint is where each call's control stream goes (host:port); CreateCall's
	// session overrides it per call. SessionTLS, when set, is the TLS (or mTLS) client config.
	SessionEndpoint string
	SessionTLS      *tls.Config
	// SessionKeepalive is the gRPC keepalive ping interval on control streams (10 s); a stream
	// whose pings go unanswered for two intervals is dead.
	SessionKeepalive time.Duration
	// OutboundProxy is where a dial goes when its target names no proxy (a SIP URI whose
	// transport parameter picks udp, tcp or tls); empty: the Request-URI's host.
	OutboundProxy string
	// Codecs are the SIP-leg codecs in the node's order of preference: what its INVITEs offer,
	// and how it picks among a caller's offer. Empty: audio.PhoneCodecs (opus/48000/2, G.722,
	// PCMU, PCMA; Opus only when built with libopus).
	Codecs []string
	// CallRefHeader names the SIP header that carries a call's call_ref (e.g. X-Call-Ref; empty:
	// none). An inbound INVITE's well-formed value becomes the call_ref; a CreateCall's
	// to.headers value is accepted as its call_ref.
	CallRefHeader string
	// RoomHeader names the SIP header whose value is a room to join or create (e.g.
	// X-Room-Ref; empty: none).
	RoomHeader string
	// Heartbeat facts for controllers: the Roomr address they dial, the SIP address, the RTP
	// port range ([0, 0]: any), the node's version and region.
	ControlAddr, SIPAddr string
	RTPPorts             [2]int
	Version, Region      string
}

func (c *Config) defaults() {
	if c.RTPHost == "" {
		c.RTPHost = "127.0.0.1"
	}
	if c.AdvertiseHost == "" || c.AdvertiseHost == "0.0.0.0" {
		c.AdvertiseHost = c.RTPHost
	}
	if c.Heartbeat <= 0 {
		c.Heartbeat = 2 * time.Second
	}
	if c.MediaTimeout <= 0 {
		c.MediaTimeout = 15 * time.Second
	}
	if c.MaxDuration <= 0 {
		c.MaxDuration = 4 * time.Hour
	}
	if c.MaxParticipants <= 0 {
		c.MaxParticipants = 10
	}
	if c.MaxRooms <= 0 {
		c.MaxRooms = DefaultMaxRooms
	}
	if len(c.Codecs) == 0 {
		c.Codecs = audio.PhoneCodecs()
	}
	if c.Logger == nil {
		c.Logger = slog.Default()
	}
	if c.EmptyRoomTimeout == 0 {
		c.EmptyRoomTimeout = 30 * time.Second
	}
	if c.AnswerTimeout <= 0 {
		c.AnswerTimeout = 10 * time.Second
	}
	if c.ReadyTimeout <= 0 {
		c.ReadyTimeout = 10 * time.Second
	}
	if c.SessionKeepalive <= 0 {
		c.SessionKeepalive = 10 * time.Second
	}
}

// Node owns rooms and calls.
type Node struct {
	cfg Config
	// holdAudio fetches hold music (Hold{music}, warm-transfer music).
	holdAudio *http.Client
	nc        *nats.Conn

	mu    sync.Mutex
	rooms map[string]*Room
	// reserved are room refs CreateCall holds a place for while the callee rings: the room is
	// created only on 200 OK, but the place counts toward MaxRooms meanwhile.
	reserved map[string]int
	// calls by call_ref, ended calls included for CallDedupeWindow.
	calls  map[string]*call
	dialer TargetDialer
	window time.Duration

	// stop ends the heartbeats (Down); beatMu keeps a heartbeat from following node.down.
	stop     chan struct{}
	downOnce sync.Once
	beatMu   sync.Mutex

	// OnRoomCount is told the number of active rooms whenever it changes (registrations).
	OnRoomCount func(n int)
}

// New creates a node; nc may be nil (no events, no heartbeats). Start begins the heartbeats.
func New(nc *nats.Conn, cfg Config) *Node {
	cfg.defaults()
	return &Node{cfg: cfg, nc: nc, rooms: map[string]*Room{}, reserved: map[string]int{},
		calls: map[string]*call{}, stop: make(chan struct{}),
		holdAudio: &http.Client{Timeout: 10 * time.Second}, window: CallDedupeWindow}
}

// SetDialer gives the node a way to place outbound legs (CreateCall and transfers).
func (n *Node) SetDialer(d TargetDialer) {
	n.mu.Lock()
	n.dialer = d
	n.mu.Unlock()
}

func (n *Node) targetDialer() TargetDialer {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.dialer
}

// ID is the node's ref (node_ref in heartbeats and events).
func (n *Node) ID() string { return n.cfg.NodeID }

// Held reports whether a room has a participant on hold (tests and debugging).
func (n *Node) Held(roomRef string) bool {
	if r := n.room(roomRef); r != nil {
		r.mu.Lock()
		defer r.mu.Unlock()
		return len(r.held) > 0
	}
	return false
}

// Participants counts a room's participants (-1: no such room; tests and debugging).
func (n *Node) Participants(roomRef string) int {
	r := n.room(roomRef)
	if r == nil {
		return -1
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	return len(r.participants)
}

// Start publishes heartbeats until Down.
func (n *Node) Start() error {
	go n.heartbeats()
	return nil
}

// Down stops the heartbeats and publishes node.down, so placement stops choosing this node. It
// is the first step of a drain; rooms keep running (WaitRooms, Shutdown).
func (n *Node) Down() {
	n.downOnce.Do(func() {
		n.beatMu.Lock()
		close(n.stop)
		n.beatMu.Unlock()
		n.publish(HeartbeatSubject(n.cfg.NodeID), Event{"type": "node.down", "node_ref": n.cfg.NodeID})
		if n.nc != nil {
			_ = n.nc.FlushTimeout(500 * time.Millisecond)
		}
	})
}

// busy counts what a drain waits for: rooms, and CreateCall dials still ringing.
func (n *Node) busy() int {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.loadLocked()
}

// WaitRooms returns when the last room (and ringing dial) has ended, or ends what is still up
// after maxWait with node_error. Stop cuts the wait short. It returns the number of rooms it had
// to end.
func (n *Node) WaitRooms(maxWait time.Duration, stop <-chan struct{}) int {
	deadline := time.NewTimer(maxWait)
	defer deadline.Stop()
	poll := time.NewTicker(100 * time.Millisecond)
	defer poll.Stop()
	for n.busy() > 0 {
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

// endAll ends every room and every call still ringing.
func (n *Node) endAll(cause string) int {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	var calls []*call
	for _, c := range n.calls {
		calls = append(calls, c)
	}
	n.mu.Unlock()
	for _, r := range rooms {
		r.end(cause, 0)
	}
	for _, c := range calls {
		c.end(cause, 0)
	}
	return len(rooms)
}

// AtCapacity reports whether the node holds MaxRooms rooms (and reservations).
func (n *Node) AtCapacity() bool {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.loadLocked() >= n.cfg.MaxRooms
}

// ActiveRooms counts rooms that have not ended.
func (n *Node) ActiveRooms() int {
	n.mu.Lock()
	defer n.mu.Unlock()
	return len(n.rooms)
}

// Shutdown ends every room and call and, unless Down already did, publishes node.down.
func (n *Node) Shutdown() {
	n.endAll(ReasonNodeError)
	n.Down()
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

// HeartbeatSubject is where node nodeRef publishes its heartbeat every heartbeatInterval and
// node.down when it starts draining (media-control "Nodes report capacity and liveness").
func HeartbeatSubject(nodeRef string) string { return "roomr.nodes." + nodeRef + ".heartbeat" }

// NodeEventsSubject is where node nodeRef publishes registration.state.
func NodeEventsSubject(nodeRef string) string { return "roomr.nodes." + nodeRef + ".events" }

// heartbeat is node.heartbeat; type tells it from node.down on the same subject.
func (n *Node) heartbeat(rooms, participants int) Event {
	ev := Event{"type": "node.heartbeat", "node_ref": n.cfg.NodeID, "rooms": rooms,
		"participants": participants, "max_rooms": n.cfg.MaxRooms,
		"codecs": n.cfg.Codecs, "version": n.cfg.Version, "region": n.cfg.Region,
		"control_addr": n.cfg.ControlAddr, "sip_addr": n.cfg.SIPAddr}
	if p := n.cfg.RTPPorts; p[1] != 0 {
		ev["rtp_ports"] = Event{"min": p[0], "max": p[1]}
	}
	return ev
}

func (n *Node) beat() {
	n.beatMu.Lock()
	defer n.beatMu.Unlock()
	select {
	case <-n.stop:
		return
	default:
	}
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	n.mu.Unlock()
	participants := 0
	for _, r := range rooms {
		r.mu.Lock()
		participants += len(r.participants)
		r.mu.Unlock()
	}
	n.publish(HeartbeatSubject(n.cfg.NodeID), n.heartbeat(len(rooms), participants))
}

// publish sends one event on core NATS, best effort: while NATS is unreachable the event is
// dropped (the connection buffers nothing), never retried and never blocks a call.
func (n *Node) publish(subject string, ev Event) {
	if n.nc == nil {
		return
	}
	data, err := json.Marshal(ev)
	if err != nil {
		return
	}
	_ = n.nc.Publish(subject, data)
}

// newRef is prefix-<128 random bits in hex>: refs the node generates cannot be guessed.
func newRef(prefix string) string {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return prefix + "-" + hex.EncodeToString(b[:])
}

// validRef reports whether s can be a call_ref or room_ref: one NATS subject token, printable,
// at most 128 bytes.
func validRef(s string) bool {
	if s == "" || len(s) > 128 || strings.ContainsAny(s, ". *>") {
		return false
	}
	for _, c := range s {
		if c < 0x21 || c == 0x7f {
			return false
		}
	}
	return true
}

// loadLocked is the room count MaxRooms applies to: rooms, plus refs reserved by ringing
// CreateCalls that name no existing room.
func (n *Node) loadLocked() int {
	load := len(n.rooms)
	for ref := range n.reserved {
		if n.rooms[ref] == nil {
			load++
		}
	}
	return load
}

// reserve holds a place for room ref while a CreateCall rings (no place is needed when the room
// exists or is already reserved).
func (n *Node) reserve(ref string) error {
	n.mu.Lock()
	defer n.mu.Unlock()
	if n.rooms[ref] == nil && n.reserved[ref] == 0 && n.loadLocked() >= n.cfg.MaxRooms {
		return n.atCapacity()
	}
	n.reserved[ref]++
	return nil
}

func (n *Node) releaseLocked(ref string) {
	if n.reserved[ref] > 1 {
		n.reserved[ref]--
		return
	}
	delete(n.reserved, ref)
}

// release gives back a reservation of ref.
func (n *Node) release(ref string) {
	n.mu.Lock()
	n.releaseLocked(ref)
	n.mu.Unlock()
}

func (n *Node) atCapacity() *Error {
	return errorf(CodeAtCapacity, "node %s holds its limit of %d rooms", n.cfg.NodeID, n.cfg.MaxRooms)
}

// openRoom returns room ref, creating it when missing (ref "" picks a new one). With join an
// existing room is returned, else it is room_exists; held means the caller holds a reservation
// for ref, consumed here. implicit marks a room opened by a call: it ends with its last call.
func (n *Node) openRoom(ref string, join, held, implicit bool) (*Room, error) {
	if ref == "" {
		ref = newRef("room")
	}
	n.mu.Lock()
	if held {
		n.releaseLocked(ref)
	}
	if r := n.rooms[ref]; r != nil {
		n.mu.Unlock()
		if join {
			return r, nil
		}
		return nil, errorf(CodeRoomExists, "%s", ref)
	}
	if !join && n.reserved[ref] > 0 {
		n.mu.Unlock()
		return nil, errorf(CodeRoomExists, "%s", ref)
	}
	if !held && n.reserved[ref] == 0 && n.loadLocked() >= n.cfg.MaxRooms {
		n.mu.Unlock()
		return nil, n.atCapacity()
	}
	r := newRoom(n, ref, implicit)
	n.rooms[ref] = r
	count := len(n.rooms)
	n.mu.Unlock()
	if n.OnRoomCount != nil {
		n.OnRoomCount(count)
	}
	go r.run()
	return r, nil
}

func (n *Node) roomEnded(r *Room) {
	n.mu.Lock()
	if n.rooms[r.Ref] == r {
		delete(n.rooms, r.Ref)
	}
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

func (n *Node) allRooms() []*Room {
	n.mu.Lock()
	defer n.mu.Unlock()
	out := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		out = append(out, r)
	}
	return out
}

package node

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fonoster/fonoster/go/roomr/internal/audio"
	"github.com/fonoster/fonoster/go/roomr/internal/jitter"
	"github.com/fonoster/fonoster/go/roomr/internal/telemetry"

	"github.com/fonoster/fonoster/go/roomr/internal/netguard"
	"github.com/nats-io/nats.go"
	"go.opentelemetry.io/otel/attribute"
)

// DefaultMaxRooms is the room limit when none is configured (media-node "Capacity bar").
const DefaultMaxRooms = 200

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
	// MaxRooms is the most rooms the node holds at once (200, the capacity bar). room.create and
	// INVITEs beyond it are refused, and heartbeats report it so placement skips a full node.
	MaxRooms int
	// RequireEncryption refuses plain RTP on every leg (MN6): SIP legs must offer RTP/SAVP with
	// an SDES key, and the gateway's rtp blocks must carry srtp.
	RequireEncryption bool
	// AllowedDestinations are private hosts, IPs or CIDRs hold music may come from
	// (FONOSTER_ALLOWED_DESTINATIONS); everything else must be public (RV-B2).
	AllowedDestinations []string
	Logger              *slog.Logger
	// Registry, when set, receives this node's session-registry entries (nodes.<id> on every
	// heartbeat, rooms.<ref> while a room lives; add-media-node 3.2). Nil keeps heartbeats only.
	Registry Registry
	// RoomRefresh is how often live room entries are rewritten (5 s; the bucket TTL is 15 s).
	RoomRefresh time.Duration
	// EmptyRoomTimeout ends a room with no participant and no dial in progress for this long
	// (30 s; negative disables): whoever sent room.create is gone (orphans.go).
	EmptyRoomTimeout time.Duration
	// OwnerTimeout ends a room whose gateway, once heard, sent no gateway.heartbeat for this
	// long (20 s, four missed beats; negative disables).
	OwnerTimeout time.Duration
	// Codecs are the SIP-leg codecs in the node's order of preference: what its INVITEs offer,
	// and how it picks among a caller's offer. Empty: audio.PhoneCodecs (opus/48000/2, G.722,
	// PCMU, PCMA; Opus only when built with libopus). Leave Opus out to disable it.
	Codecs []string
	// CallRefHeader is the SIP header that carries a call's call_ref (e.g. X-Call-Ref; empty:
	// none). An inbound INVITE's value becomes the call_ref when well formed (else the node picks
	// one); a CreateCall's to.headers value is accepted as its call_ref.
	CallRefHeader string
	// Heartbeat facts for controllers (media-control "Heartbeat"): the Roomr address they
	// dial, the SIP address, the RTP port range ([0, 0]: any), the node's version and region.
	ControlAddr, SIPAddr string
	RTPPorts             [2]int
	Version, Region      string
}

// Registry is the slice of the session registry the node writes (registry.KV fits).
type Registry interface {
	Put(kind, id string, value any)
	Delete(kind, id string)
	Close()
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
	if c.MaxRooms <= 0 {
		c.MaxRooms = DefaultMaxRooms
	}
	if len(c.Codecs) == 0 {
		c.Codecs = audio.PhoneCodecs()
	}
	if c.Logger == nil {
		c.Logger = slog.Default()
	}
	if c.RoomRefresh == 0 {
		c.RoomRefresh = 5 * time.Second
	}
	if c.EmptyRoomTimeout == 0 {
		c.EmptyRoomTimeout = 30 * time.Second
	}
	if c.OwnerTimeout == 0 {
		c.OwnerTimeout = 20 * time.Second
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
	// roomsWritten is when live room entries were last rewritten in the registry.
	roomsWritten time.Time
	dialer       Dialer
	gateways     gatewayWatch
	// ctl is Roomr's call table (control.go).
	ctl callTable
	// events are the per-call event streams (callevents.go).
	events eventStreams
	cpu    cpuSampler

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
		// The gateway's traceparent header: this command's span joins the call's trace.
		ctx := context.Background()
		if m.Header != nil {
			ctx = telemetry.Extract(ctx, m.Header.Get(telemetry.TraceparentHeader))
		}
		reply := n.handleRaw(ctx, m.Data)
		data, _ := json.Marshal(reply)
		_ = m.Respond(data)
	})
	if err != nil {
		return err
	}
	n.subs = append(n.subs, sub)
	n.watchGateways()
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

// AtCapacity reports whether the node holds MaxRooms rooms (Routr registration reports it full).
func (n *Node) AtCapacity() bool {
	n.mu.Lock()
	defer n.mu.Unlock()
	return len(n.rooms) >= n.cfg.MaxRooms
}

// validToken reports whether s can sit in one NATS subject token ("" is fine: no call).
func validToken(s string) bool {
	return !strings.ContainsAny(s, ". *>\t\r\n")
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
	n.publish(HeartbeatSubject(n.cfg.NodeID), Event{"type": "node.down", "node_ref": n.cfg.NodeID})
	_ = n.nc.Flush()
	if reg := n.cfg.Registry; reg != nil {
		reg.Delete("nodes", n.cfg.NodeID)
		reg.Close()
	}
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

// HeartbeatSubject is where node nodeRef publishes its heartbeat every 2 s and node.down on a
// clean exit (media-control "Nodes report capacity and liveness").
func HeartbeatSubject(nodeRef string) string { return "roomr.nodes." + nodeRef + ".heartbeat" }

// heartbeat is node.heartbeat with media-control's fields; type tells it from node.down on the
// same subject.
func (n *Node) heartbeat(rooms, participants int, draining bool) Event {
	ev := Event{"type": "node.heartbeat", "node_ref": n.cfg.NodeID, "rooms": rooms,
		"participants": participants, "max_rooms": n.cfg.MaxRooms, "cpu_idle": n.cpu.sample(),
		"codecs": n.cfg.Codecs, "draining": draining, "version": n.cfg.Version, "region": n.cfg.Region,
		"control_addr": n.cfg.ControlAddr, "sip_addr": n.cfg.SIPAddr}
	if p := n.cfg.RTPPorts; p[1] != 0 {
		ev["rtp_ports"] = Event{"min": p[0], "max": p[1]}
	}
	return ev
}

func (n *Node) beat() {
	n.mu.Lock()
	rooms := make([]*Room, 0, len(n.rooms))
	for _, r := range n.rooms {
		rooms = append(rooms, r)
	}
	draining := n.draining
	var refresh []string
	now := time.Now()
	if n.cfg.Registry != nil && now.Sub(n.roomsWritten) >= n.cfg.RoomRefresh {
		n.roomsWritten = now
		for ref := range n.rooms {
			refresh = append(refresh, ref)
		}
	}
	n.mu.Unlock()
	participants := 0
	for _, r := range rooms {
		r.mu.Lock()
		participants += len(r.participants)
		r.mu.Unlock()
	}
	ev := n.heartbeat(len(rooms), participants, draining)
	n.publish(HeartbeatSubject(n.cfg.NodeID), ev)
	if reg := n.cfg.Registry; reg != nil {
		entry := Event{"at": now.UTC().Format(time.RFC3339Nano)}
		for k, v := range ev {
			if k != "type" && k != "cpu_idle" {
				entry[k] = v
			}
		}
		reg.Put("nodes", n.cfg.NodeID, entry)
		for _, ref := range refresh {
			n.writeRoom(ref, now)
		}
	}
}

func (n *Node) writeRoom(ref string, now time.Time) {
	n.cfg.Registry.Put("rooms", ref, Event{"roomRef": ref, "nodeId": n.cfg.NodeID,
		"at": now.UTC().Format(time.RFC3339Nano)})
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
	// The same event keyed by call, on roomr.events.<call_ref> (callevents.go).
	n.forward(roomRef, ev)
}

func (n *Node) nextRef(prefix string) string {
	n.mu.Lock()
	defer n.mu.Unlock()
	n.seq++
	return fmt.Sprintf("%s-%s-%d-%d", prefix, n.cfg.NodeID, time.Now().UnixNano()%1_000_000, n.seq)
}

// newRoom opens a room with a new ref; callRef ("" for none) is the API-originated call it was
// created for.
func (n *Node) newRoom(callRef string) (*Room, error) { return n.newRoomRef("", callRef) }

// newRoomRef opens a room with the given ref ("" picks one; a ref in use is refused) for callRef.
// The draining, ref and limit checks and the insert share one lock, so concurrent room.create
// commands and Roomr CreateRoom / CreateCall never take the node past MaxRooms.
func (n *Node) newRoomRef(ref, callRef string) (*Room, error) {
	if ref == "" {
		ref = n.nextRef("room")
	}
	r := newRoom(n, ref)
	r.callRef = callRef
	n.mu.Lock()
	if n.draining {
		n.mu.Unlock()
		return nil, errDraining
	}
	if _, taken := n.rooms[ref]; taken {
		n.mu.Unlock()
		return nil, errRoomExists
	}
	if len(n.rooms) >= n.cfg.MaxRooms {
		n.mu.Unlock()
		return nil, errAtCapacity
	}
	n.rooms[r.Ref] = r
	count := len(n.rooms)
	n.mu.Unlock()
	if n.OnRoomCount != nil {
		n.OnRoomCount(count)
	}
	if n.cfg.Registry != nil {
		n.writeRoom(r.Ref, time.Now())
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
	if n.cfg.Registry != nil {
		n.cfg.Registry.Delete("rooms", r.Ref)
	}
	n.callsRoomEnded(r.Ref)
}

func (n *Node) room(ref string) *Room {
	n.mu.Lock()
	defer n.mu.Unlock()
	return n.rooms[ref]
}

// Incoming handles an INVITE: a room with the caller, then call.incoming until a gateway claims
// it; no claim within the timeout, twice, refuses the call with 503.
func (n *Node) Incoming(call IncomingCall) {
	call.CallRef = n.inboundCallRef(call.Headers)
	ctx, endSpan := telemetry.StartCall(context.Background(), "roomr.call.incoming", call.CallRef)
	defer endSpan()
	if _, _, ok := call.Media.ChoosePreferred(n.cfg.Codecs...); !ok {
		_ = call.Leg.Reject(488)
		return
	}
	if n.cfg.RequireEncryption && !call.Media.Secure {
		_ = call.Leg.Reject(488)
		return
	}
	room, err := n.newRoom("")
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
	n.trackInbound(call.CallRef, room.Ref, caller.Ref)
	n.openCall(call.CallRef, room.Ref, caller.Ref, nil, Event{"direction": orDefault(call.Direction, "inbound"),
		"from": call.From, "to": call.To, "participant_ref": caller.Ref})
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
	ev["callRef"] = call.CallRef
	data, _ := json.Marshal(ev)
	// The call's trace continues in the gateway that claims it (traceparent header).
	req := &nats.Msg{Subject: IncomingSubject, Data: data, Header: nats.Header{}}
	if tp := telemetry.Traceparent(ctx); tp != "" {
		req.Header.Set(telemetry.TraceparentHeader, tp)
	}
	for attempt := 0; attempt < 2; attempt++ {
		msg, err := n.nc.RequestMsg(req, n.cfg.ClaimTimeout)
		if err != nil {
			continue
		}
		var reply map[string]any
		if json.Unmarshal(msg.Data, &reply) == nil && reply["type"] == "claimed" {
			gatewayRef, _ := reply["gatewayRef"].(string)
			room.setOwner(gatewayRef)
			telemetry.CallIncoming(ctx, call.CallRef, "claimed")
			return
		}
	}
	telemetry.CallIncoming(ctx, call.CallRef, "unclaimed")
	n.cfg.Logger.Warn("no gateway claimed the call", "room", room.Ref, telemetry.CallRefKey, call.CallRef)
	_ = call.Leg.Reject(503)
	room.end(ReasonNodeError, 503, "")
	n.publishCallFailed(call.CallRef, call, ReasonNodeError)
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

func (n *Node) handleRaw(ctx context.Context, data []byte) Command {
	var cmd Command
	if err := json.Unmarshal(data, &cmd); err != nil {
		return Command{"type": "error", "id": "", "code": "bad_message"}
	}
	typ, _ := cmd["type"].(string)
	room, _ := cmd["roomRef"].(string)
	ctx, end := telemetry.StartSpan(ctx, "roomr.command",
		attribute.String("fonoster.command", typ), attribute.String("fonoster.room_ref", room))
	defer end()
	return n.Handle(ctx, cmd)
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
		callRef, _ := cmd["callRef"].(string)
		if !validToken(callRef) {
			return fail("bad_message", "callRef must be a single subject token")
		}
		r, err := n.newRoom(callRef)
		if errors.Is(err, errAtCapacity) {
			return fail("at_capacity", fmt.Sprintf("node %s holds its limit of %d rooms", n.cfg.NodeID, n.cfg.MaxRooms))
		}
		if err != nil {
			return fail("draining", "")
		}
		r.setMaxDuration(cmd)
		n.openCall(callRef, r.Ref, "", nil, Event{"direction": "outbound"})
		return ack(Command{"roomRef": r.Ref})
	}
	roomRef, _ := cmd["roomRef"].(string)
	r := n.room(roomRef)
	if r == nil {
		return fail("room_not_found", roomRef)
	}
	gatewayRef, _ := cmd["gatewayRef"].(string)
	r.setOwner(gatewayRef)
	switch typ {
	case "ring":
		if err := r.ring(); err != nil {
			return fail("sip_error", err.Error())
		}
		n.callerEvent(r, "call.ringing")
		return ack(nil)
	case "answer":
		r.setMaxDuration(cmd)
		if err := r.answer(); err != nil {
			return fail("sip_error", err.Error())
		}
		n.callerEvent(r, "call.answered")
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

// Package jitter is the per-participant jitter buffer between a leg's RTP receiver and the room's
// 20 ms mixer clock. It reorders packets by sequence number, holds a small playout delay, reports
// gaps as losses (the caller conceals them) and counts everything it discards.
package jitter

import (
	"sync"

	"github.com/pion/rtp"
)

// Stats counts what the buffer did. Late, Overflow and Duplicate packets were discarded; Lost
// frames were concealed; Underruns are ticks with nothing to play (the sender paused or is late).
type Stats struct {
	Pushed    uint64 `json:"pushed"`
	Played    uint64 `json:"played"`
	Lost      uint64 `json:"lost"`
	Late      uint64 `json:"late"`
	Duplicate uint64 `json:"duplicate"`
	Overflow  uint64 `json:"overflow"`
	Underruns uint64 `json:"underruns"`
	// Stretched ticks held playout back one frame (concealed) to grow the delay after late packets.
	Stretched uint64 `json:"stretched"`
	// Trimmed frames were skipped on purpose to bring a grown buffer back to its target delay
	// (after a burst); they are not counted as dropped.
	Trimmed uint64 `json:"trimmed"`
}

// Dropped is every frame the buffer could not play as received.
func (s Stats) Dropped() uint64 { return s.Late + s.Overflow + s.Lost }

// Add sums two stats.
func (s Stats) Add(o Stats) Stats {
	return Stats{s.Pushed + o.Pushed, s.Played + o.Played, s.Lost + o.Lost, s.Late + o.Late,
		s.Duplicate + o.Duplicate, s.Overflow + o.Overflow, s.Underruns + o.Underruns, s.Stretched + o.Stretched, s.Trimmed + o.Trimmed}
}

// Result of one Pop.
type Result int

const (
	// Silent: nothing to play (not started, or underrun); the mixer uses silence.
	Silent Result = iota
	// Played: Payload is the next packet in order.
	Played
	// Lost: the next packet is missing but later ones are here; conceal one frame.
	Lost
)

// Buffer is safe for one pusher and one popper.
type Buffer struct {
	// Prefetch is the initial playout delay in frames (before playing starts and after an
	// underrun). Late packets raise the delay a frame at a time up to MaxDelay; it decays back
	// after quiet periods.
	Prefetch int
	MaxDelay int
	// Max is the most frames held; the oldest is dropped beyond it.
	Max int

	mu       sync.Mutex
	packets  map[uint64]*rtp.Packet
	next     uint64 // extended sequence number to play next
	highest  uint64
	started  bool // seen any packet (extended numbering anchored)
	playing  bool // prefetched and playing
	anchored bool // next has been set once; anything older is late from then on
	// skips are sequence numbers used by other payloads on the stream (RFC 4733 events): they
	// are not audio, so they are neither played nor lost.
	skips     map[uint64]bool
	overTicks int
	// delay is the current target delay in frames; stretch asks Pop to hold back one tick.
	delay      int
	stretch    bool
	quietTicks int
	stats      Stats
}

// trimAfter is how many ticks in a row the buffer may sit above its target before one frame is
// skipped to win the delay back.
const trimAfter = 50

// New returns a buffer with a 40 ms playout delay holding at most 200 ms.
func New() *Buffer { return &Buffer{Prefetch: 2, MaxDelay: 5, Max: 10} }

// decayAfter is how many ticks without a late packet bring the delay down one frame.
const decayAfter = 500

func (b *Buffer) target() int {
	if b.delay < b.Prefetch {
		b.delay = b.Prefetch
	}
	return b.delay
}

// extend unwraps a 16-bit sequence number near the highest one seen.
func (b *Buffer) extend(seq uint16) uint64 {
	if !b.started {
		b.started = true
		b.highest = uint64(seq) + 1<<32 // room below for reordering at the start
		return b.highest
	}
	cycle := b.highest &^ 0xffff
	ext := cycle | uint64(seq)
	// Pick the candidate closest to the highest seen.
	switch {
	case ext+0x8000 < b.highest:
		ext += 0x10000
	case ext > b.highest+0x8000 && ext >= 0x10000:
		ext -= 0x10000
	}
	return ext
}

// Push adds a packet in arrival order.
func (b *Buffer) Push(p *rtp.Packet) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if b.packets == nil {
		b.packets = map[uint64]*rtp.Packet{}
	}
	ext := b.extend(p.SequenceNumber)
	if b.anchored && ext < b.next {
		b.stats.Late++
		if b.MaxDelay > 0 && b.target() < b.MaxDelay {
			b.delay++
			b.stretch = true
		}
		b.quietTicks = 0
		return
	}
	if _, dup := b.packets[ext]; dup {
		b.stats.Duplicate++
		return
	}
	b.stats.Pushed++
	b.packets[ext] = p
	if ext > b.highest {
		b.highest = ext
	}
	for len(b.packets) > b.Max {
		oldest := b.minKey()
		delete(b.packets, oldest)
		b.stats.Overflow++
		if b.anchored && oldest >= b.next {
			b.next = oldest + 1
		}
	}
}

// maxSkips caps the sequence numbers held for non-audio packets: a sender that floods events
// or odd payload types cannot grow the buffer without bound (RV-B8).
const maxSkips = 64

// Skip marks a sequence number taken by a non-audio packet (an RFC 4733 event).
func (b *Buffer) Skip(seq uint16) {
	b.mu.Lock()
	defer b.mu.Unlock()
	ext := b.extend(seq)
	if b.anchored && ext < b.next {
		return
	}
	if b.skips == nil {
		b.skips = map[uint64]bool{}
	}
	if len(b.skips) >= maxSkips {
		b.pruneSkips()
		if len(b.skips) >= maxSkips {
			return // a lost skip only costs one concealed frame
		}
	}
	b.skips[ext] = true
	if ext > b.highest {
		b.highest = ext
	}
}

func (b *Buffer) minKey() uint64 {
	first := true
	var lo uint64
	for k := range b.packets {
		if first || k < lo {
			lo, first = k, false
		}
	}
	return lo
}

// Pop is called once per mixer tick.
func (b *Buffer) Pop() (Result, []byte) {
	b.mu.Lock()
	defer b.mu.Unlock()
	if !b.playing {
		if len(b.packets) < b.target() || len(b.packets) == 0 {
			return Silent, nil
		}
		b.playing, b.anchored = true, true
		b.next = b.minKey()
	}
	if b.stretch {
		// Hold playout back one frame: the delay grows and the next packets have time to arrive.
		b.stretch = false
		b.stats.Stretched++
		return Lost, nil
	}
	if b.quietTicks++; b.quietTicks >= decayAfter && b.delay > b.Prefetch {
		b.delay--
		b.quietTicks = 0
	}
	for b.skips[b.next] {
		delete(b.skips, b.next)
		b.next++
	}
	if p, ok := b.packets[b.next]; ok {
		delete(b.packets, b.next)
		b.next++
		b.stats.Played++
		b.trim()
		return Played, p.Payload
	}
	if len(b.packets) == 0 {
		// Underrun: re-prefetch so a late sender gets its delay back. Packets older than next
		// that arrive later are counted late.
		b.playing = false
		b.stats.Underruns++
		b.pruneSkips()
		return Silent, nil
	}
	if lo := b.minKey(); lo > b.next+uint64(b.Max) {
		// The stream jumped (a new sender or a long silence): resynchronize instead of
		// concealing hundreds of frames.
		b.next = lo
		return b.popLocked()
	}
	b.next++
	b.stats.Lost++
	return Lost, nil
}

func (b *Buffer) popLocked() (Result, []byte) {
	p := b.packets[b.next]
	delete(b.packets, b.next)
	b.next++
	b.stats.Played++
	return Played, p.Payload
}

// trim skips one frame when the buffer has stayed above its target for trimAfter ticks.
func (b *Buffer) trim() {
	if len(b.packets) <= b.target()+2 {
		b.overTicks = 0
		return
	}
	if b.overTicks++; b.overTicks < trimAfter {
		return
	}
	b.overTicks = 0
	if _, ok := b.packets[b.next]; ok {
		delete(b.packets, b.next)
		b.next++
		b.stats.Trimmed++
	}
}

// pruneSkips forgets skips already played past, and ones too far ahead of playout to matter.
func (b *Buffer) pruneSkips() {
	for k := range b.skips {
		if (b.anchored && k < b.next) || k > b.highest || (b.anchored && k > b.next+uint64(4*b.Max+maxSkips)) {
			delete(b.skips, k)
		}
	}
}

// Stats returns the counters.
func (b *Buffer) Stats() Stats {
	b.mu.Lock()
	defer b.mu.Unlock()
	return b.stats
}

// Len is the number of frames waiting.
func (b *Buffer) Len() int {
	b.mu.Lock()
	defer b.mu.Unlock()
	return len(b.packets)
}

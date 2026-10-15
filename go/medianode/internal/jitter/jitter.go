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
}

// Dropped is every frame the buffer could not play as received.
func (s Stats) Dropped() uint64 { return s.Late + s.Overflow + s.Lost }

// Add sums two stats.
func (s Stats) Add(o Stats) Stats {
	return Stats{s.Pushed + o.Pushed, s.Played + o.Played, s.Lost + o.Lost, s.Late + o.Late,
		s.Duplicate + o.Duplicate, s.Overflow + o.Overflow, s.Underruns + o.Underruns}
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
	// Prefetch is the playout delay in frames before playing starts (and after an underrun).
	Prefetch int
	// Max is the most frames held; the oldest is dropped beyond it.
	Max int

	mu      sync.Mutex
	packets map[uint64]*rtp.Packet
	next    uint64 // extended sequence number to play next
	highest uint64
	started bool // seen any packet (extended numbering anchored)
	playing bool // prefetched and playing
	anchored bool // next has been set once; anything older is late from then on
	stats   Stats
}

// New returns a buffer with a 40 ms playout delay holding at most 200 ms.
func New() *Buffer { return &Buffer{Prefetch: 2, Max: 10} }

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
		if len(b.packets) < b.Prefetch || len(b.packets) == 0 {
			return Silent, nil
		}
		b.playing, b.anchored = true, true
		b.next = b.minKey()
	}
	if p, ok := b.packets[b.next]; ok {
		delete(b.packets, b.next)
		b.next++
		b.stats.Played++
		return Played, p.Payload
	}
	if len(b.packets) == 0 {
		// Underrun: re-prefetch so a late sender gets its delay back. Packets older than next
		// that arrive later are counted late.
		b.playing = false
		b.stats.Underruns++
		return Silent, nil
	}
	b.next++
	b.stats.Lost++
	return Lost, nil
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

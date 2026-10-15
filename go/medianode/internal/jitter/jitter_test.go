package jitter

import (
	"testing"

	"github.com/pion/rtp"
)

func pkt(seq uint16) *rtp.Packet {
	return &rtp.Packet{Header: rtp.Header{SequenceNumber: seq}, Payload: []byte{byte(seq)}}
}

func drain(b *Buffer, n int) []string {
	out := []string{}
	for i := 0; i < n; i++ {
		r, p := b.Pop()
		switch r {
		case Played:
			out = append(out, string(rune('0'+p[0]%10)))
		case Lost:
			out = append(out, "L")
		default:
			out = append(out, "-")
		}
	}
	return out
}

func TestReordersWithinThePlayoutDelay(t *testing.T) {
	b := New()
	for _, s := range []uint16{1, 3, 2, 4, 6, 5} {
		b.Push(pkt(s))
	}
	got := drain(b, 7)
	want := []string{"1", "2", "3", "4", "5", "6", "-"}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("played %v, want %v", got, want)
		}
	}
	if s := b.Stats(); s.Dropped() != 0 || s.Underruns != 1 {
		t.Fatalf("stats %+v", s)
	}
}

func TestLossIsConcealedAndLateIsDropped(t *testing.T) {
	b := New()
	for _, s := range []uint16{10, 11, 13, 14} {
		b.Push(pkt(s))
	}
	got := drain(b, 3)
	if got[0] != "0" || got[1] != "1" || got[2] != "L" {
		t.Fatalf("played %v", got)
	}
	b.Push(pkt(12)) // arrives after its slot
	if s := b.Stats(); s.Lost != 1 || s.Late != 1 {
		t.Fatalf("stats %+v", s)
	}
}

func TestSequenceWrap(t *testing.T) {
	b := New()
	for _, s := range []uint16{65534, 65535, 0, 1} {
		b.Push(pkt(s))
	}
	got := drain(b, 4)
	for _, g := range got {
		if g == "L" || g == "-" {
			t.Fatalf("wrap broke playout: %v", got)
		}
	}
}

func TestOverflowDropsOldest(t *testing.T) {
	b := New()
	for s := uint16(0); s < 15; s++ {
		b.Push(pkt(s))
	}
	if s := b.Stats(); s.Overflow != 5 {
		t.Fatalf("stats %+v", s)
	}
	if r, p := b.Pop(); r != Played || p[0] != 5 {
		t.Fatalf("first played %v %v", r, p)
	}
}

func TestDuplicates(t *testing.T) {
	b := New()
	b.Push(pkt(1))
	b.Push(pkt(1))
	if s := b.Stats(); s.Duplicate != 1 || s.Pushed != 1 {
		t.Fatalf("stats %+v", s)
	}
}

func TestSkippedSequenceNumbersAreNotLosses(t *testing.T) {
	b := New()
	b.Push(pkt(1))
	b.Push(pkt(2))
	for s := uint16(3); s < 8; s++ {
		b.Skip(s) // an RFC 4733 event took these
	}
	b.Push(pkt(8))
	b.Push(pkt(9))
	got := drain(b, 4)
	if got[0] != "1" || got[1] != "2" || got[2] != "8" || got[3] != "9" {
		t.Fatalf("played %v", got)
	}
	if s := b.Stats(); s.Lost != 0 || s.Overflow != 0 {
		t.Fatalf("stats %+v", s)
	}
}

func TestGrownBufferIsTrimmed(t *testing.T) {
	b := New()
	seq := uint16(0)
	for i := 0; i < 8; i++ { // a burst: 8 frames at once
		b.Push(pkt(seq))
		seq++
	}
	for i := 0; i < trimAfter*3; i++ {
		b.Push(pkt(seq))
		seq++
		b.Pop()
	}
	if s := b.Stats(); s.Trimmed == 0 || b.Len() > 6 || s.Dropped() != 0 {
		t.Fatalf("len %d stats %+v", b.Len(), s)
	}
}

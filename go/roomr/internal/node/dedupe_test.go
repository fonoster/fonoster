package node

import (
	"testing"
	"time"
)

// An ended call is remembered for the dedupe window (a constant 10 minutes) and forgotten after.
func TestEndedCallsExpireAfterTheDedupeWindow(t *testing.T) {
	if CallDedupeWindow != 10*time.Minute {
		t.Fatalf("CallDedupeWindow = %v, want 10m", CallDedupeWindow)
	}
	n := New(nil, Config{})
	n.window = 50 * time.Millisecond
	c := n.newCall("c1", false)
	n.mu.Lock()
	n.registerLocked(c)
	n.mu.Unlock()
	c.end(ReasonRemoved, 0)
	if n.call("c1") == nil {
		t.Fatal("an ended call was forgotten inside the window")
	}
	if got, err := n.GetCall("c1"); err != nil || got.State != CallEnded {
		t.Fatalf("GetCall = %+v, %v", got, err)
	}
	time.Sleep(80 * time.Millisecond)
	if n.call("c1") != nil {
		t.Fatal("an ended call outlived the window")
	}
}

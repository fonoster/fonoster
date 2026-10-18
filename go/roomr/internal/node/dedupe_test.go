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
	tbl := callTable{window: 50 * time.Millisecond}
	tbl.mu.Lock()
	tbl.putLocked(&callEntry{info: CallInfo{CallRef: "c1", State: CallRinging}})
	tbl.endLocked(tbl.calls["c1"])
	kept := tbl.lookupLocked("c1") != nil
	tbl.mu.Unlock()
	if !kept {
		t.Fatal("an ended call was forgotten inside the window")
	}
	time.Sleep(80 * time.Millisecond)
	tbl.mu.Lock()
	gone := tbl.lookupLocked("c1") == nil
	tbl.mu.Unlock()
	if !gone {
		t.Fatal("an ended call outlived the window")
	}
}

package e2e

import (
	"fmt"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
)

// Events keyed by call: a second controller replica, on its own NATS connection, follows a call
// it did not place on roomr.events.<call_ref>; seq is contiguous and the metadata from
// CreateCall are echoed on every event.

// expectSeq reads the next events, checking their types, call_ref, node_ref and seq first,
// first+1, ….
func expectSeq(t *testing.T, events chan map[string]any, callRef, nodeRef string, first int, types ...string) []map[string]any {
	t.Helper()
	var got []map[string]any
	for i, want := range types {
		seq := first + i
		select {
		case ev := <-events:
			if ev["type"] != want || ev["call_ref"] != callRef || ev["node_ref"] != nodeRef || ev["seq"] != float64(seq) {
				t.Fatalf("event %d = %v, want %s", seq, ev, want)
			}
			got = append(got, ev)
		case <-time.After(5 * time.Second):
			t.Fatalf("no %s (event %d) on the call subject", want, seq)
		}
	}
	return got
}

func TestROM029_CallEventsFollowedByAnotherReplica(t *testing.T) {
	r := start(t)
	callRef := fmt.Sprintf("ev-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(callRef))
	ctx := rpcCtx(t)
	if _, err := r.mc.CreateCall(ctx, &roomrv1.CreateCallRequest{CallRef: callRef, From: "+15550001",
		To:       &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid", Proxy: r.callee.Address()},
		Metadata: map[string]string{"tenant": "t1"}, RingTimeoutS: 10}); err != nil {
		t.Fatal(err)
	}
	got := expectSeq(t, events, callRef, r.node.ID(), 1, "call.started", "call.ringing", "call.answered",
		"participant.joined", "participant.joined")
	r.calleeCall()
	if _, err := r.mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	got = append(got, expectSeq(t, events, callRef, r.node.ID(), 6, "participant.left", "participant.left", "call.ended")...)
	if ended := got[7]; ended["cause"] != node.ReasonRemoved || ended["answered"] != true {
		t.Fatalf("call.ended %v", ended)
	}
	for _, ev := range got {
		if metadataOf(ev)["tenant"] != "t1" || ev["ts"] == nil {
			t.Fatalf("metadata or ts missing: %v", ev)
		}
	}
}

// A busy callee: call.started, call.ringing, call.ended with the SIP status and the cause; no
// room was created, so nothing on any room subject.
func TestROM022_CallEndedCarriesSIPStatusAndCause(t *testing.T) {
	r := start(t)
	r.callee.Callee("busy", 0)
	callRef := fmt.Sprintf("evbusy-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(callRef))
	call, err := r.mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil {
		t.Fatal(err)
	}
	got := expectSeq(t, events, callRef, r.node.ID(), 1, "call.started", "call.ringing", "call.ended")
	if ended := got[2]; ended["sip_status"] != float64(486) || ended["cause"] != "busy" || ended["answered"] != false {
		t.Fatalf("call.ended %v", ended)
	}
	time.Sleep(300 * time.Millisecond)
	if ev := r.find(typed("room.ended", "room_ref", call.RoomRef)); ev != nil {
		t.Fatalf("room event for a call that never had a room: %v", ev)
	}
}

// The heartbeat carries the capacity fields and nothing retired (cpu_idle, draining).
func TestROM031_HeartbeatFields(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) {
		c.Version, c.Region, c.ControlAddr, c.SIPAddr = "1.4.0", "us-east", "10.0.0.5:50061", "10.0.0.5:5060"
		c.RTPPorts, c.MaxRooms = [2]int{10000, 20000}, 200
	}})
	beats := replica(t, node.HeartbeatSubject(r.node.ID()))
	select {
	case ev := <-beats:
		for k, want := range map[string]any{"type": "node.heartbeat", "node_ref": r.node.ID(), "rooms": 0.0,
			"participants": 0.0, "max_rooms": 200.0, "version": "1.4.0", "region": "us-east",
			"control_addr": "10.0.0.5:50061", "sip_addr": "10.0.0.5:5060"} {
			if ev[k] != want {
				t.Fatalf("heartbeat %s = %v, want %v (%v)", k, ev[k], want, ev)
			}
		}
		for _, retired := range []string{"cpu_idle", "draining"} {
			if _, has := ev[retired]; has {
				t.Fatalf("heartbeat still carries %s: %v", retired, ev)
			}
		}
		codecs, _ := ev["codecs"].([]any)
		ports, _ := ev["rtp_ports"].(map[string]any)
		if len(codecs) == 0 || ports["min"] != 10000.0 || ports["max"] != 20000.0 {
			t.Fatalf("heartbeat %v", ev)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no heartbeat")
	}
}

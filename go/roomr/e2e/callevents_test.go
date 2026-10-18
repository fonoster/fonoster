package e2e

import (
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	roomrv1 "github.com/fonoster/fonoster/go/roomr/api/roomr/v1"
	"github.com/fonoster/fonoster/go/roomr/internal/node"
	"github.com/nats-io/nats.go"
)

// Events keyed by call (redesign-media-node task 4.3): a second controller replica, on its own
// NATS connection, follows a call it did not place on roomr.events.<call_ref>; seq is contiguous
// and the labels from CreateCall are echoed on every event.

// replica is a second controller's view of one subject.
func replica(t *testing.T, subject string) chan map[string]any {
	t.Helper()
	nc, err := nats.Connect(os.Getenv("CONFORMANCE_NATS_URL"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(nc.Close)
	events := make(chan map[string]any, 32)
	if _, err := nc.Subscribe(subject, func(m *nats.Msg) {
		var ev map[string]any
		if json.Unmarshal(m.Data, &ev) == nil {
			events <- ev
		}
	}); err != nil {
		t.Fatal(err)
	}
	_ = nc.Flush()
	return events
}

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

func TestCallEventsFollowedByAnotherReplica(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	callRef := fmt.Sprintf("ev-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(callRef))
	ctx := rpcCtx(t)
	if _, err := mc.CreateCall(ctx, &roomrv1.CreateCallRequest{CallRef: callRef, From: "+15550001",
		To:     &roomrv1.SipTarget{Uri: "sip:+15551234567@carrier.invalid", Proxy: r.callee.Address()},
		Labels: map[string]string{"tenant": "t1"}, RingTimeoutS: 10}); err != nil {
		t.Fatal(err)
	}
	got := expectSeq(t, events, callRef, r.node.ID(), 1, "call.started", "call.ringing", "call.answered", "participant.joined")
	r.calleeCall()
	if _, err := mc.EndCall(ctx, &roomrv1.EndCallRequest{CallRef: callRef}); err != nil {
		t.Fatal(err)
	}
	got = append(got, expectSeq(t, events, callRef, r.node.ID(), 5, "participant.left", "call.ended")...)
	if ended := got[5]; ended["cause"] != node.ReasonRemoved || ended["answered"] != true {
		t.Fatalf("call.ended %v", ended)
	}
	for _, ev := range got {
		if labelsOf(ev)["tenant"] != "t1" || ev["ts"] == nil {
			t.Fatalf("labels or ts missing: %v", ev)
		}
	}
}

func TestCallEndedCarriesSIPStatusAndCause(t *testing.T) {
	r := start(t)
	_, mc := r.withControl(nil)
	r.callee.Callee("busy", 0)
	callRef := fmt.Sprintf("evbusy-%d", time.Now().UnixNano())
	events := replica(t, node.CallEventsSubject(callRef))
	rooms := replica(t, node.RoomEventsSubject("*"))
	call, err := mc.CreateCall(rpcCtx(t), &roomrv1.CreateCallRequest{CallRef: callRef,
		To: &roomrv1.SipTarget{Uri: "sip:+1555@carrier.invalid", Proxy: r.callee.Address()}})
	if err != nil {
		t.Fatal(err)
	}
	got := expectSeq(t, events, callRef, r.node.ID(), 1, "call.started", "call.ringing", "call.ended")
	if ended := got[2]; ended["sip_status"] != float64(486) || ended["cause"] != "busy" || ended["answered"] != false {
		t.Fatalf("call.ended %v", ended)
	}
	deadline := time.After(3 * time.Second)
	for {
		select {
		case ev := <-rooms:
			if ev["room_ref"] != call.RoomRef {
				continue // another test's room
			}
			if ev["type"] != "room.ended" || ev["cause"] != "busy" || ev["node_ref"] != r.node.ID() {
				t.Fatalf("room event %v", ev)
			}
			return
		case <-deadline:
			t.Fatal("no room.ended on the room subject")
		}
	}
}

// The heartbeat carries media-control's fields (redesign-media-node task 3.1).
func TestHeartbeatFields(t *testing.T) {
	r := startWith(t, rigOptions{nodeCfg: func(c *node.Config) {
		c.Version, c.Region, c.ControlAddr, c.SIPAddr = "1.4.0", "us-east", "10.0.0.5:50061", "10.0.0.5:5060"
		c.RTPPorts, c.MaxRooms = [2]int{10000, 20000}, 200
	}})
	beats := replica(t, node.HeartbeatSubject(r.node.ID()))
	select {
	case ev := <-beats:
		for k, want := range map[string]any{"type": "node.heartbeat", "node_ref": r.node.ID(), "rooms": 0.0,
			"participants": 0.0, "max_rooms": 200.0, "draining": false, "version": "1.4.0", "region": "us-east",
			"control_addr": "10.0.0.5:50061", "sip_addr": "10.0.0.5:5060"} {
			if ev[k] != want {
				t.Fatalf("heartbeat %s = %v, want %v (%v)", k, ev[k], want, ev)
			}
		}
		idle, ok := ev["cpu_idle"].(float64)
		codecs, _ := ev["codecs"].([]any)
		ports, _ := ev["rtp_ports"].(map[string]any)
		if !ok || idle < 0 || idle > 1 || len(codecs) == 0 || ports["min"] != 10000.0 || ports["max"] != 20000.0 {
			t.Fatalf("heartbeat %v", ev)
		}
	case <-time.After(2 * time.Second):
		t.Fatal("no heartbeat")
	}
}

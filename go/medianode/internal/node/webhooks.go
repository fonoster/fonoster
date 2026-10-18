package node

import (
	"fmt"
)

// CallFailedToken is the last token of the subject a node reports a call no gateway claimed on:
// media.<nodeId>.events.call-failed (room refs start with "room-", so it never names a room).
// The node has no publish right on webhooks.events (M6): the control plane builds the workspace's
// call.failed webhook from this report, takes the workspace from the app (never from the node),
// and accepts only this one event type.
const CallFailedToken = "call-failed"

// CallFailedSubject is where node nodeID reports its unclaimed calls.
func CallFailedSubject(nodeID string) string {
	return fmt.Sprintf("media.%s.events.%s", nodeID, CallFailedToken)
}

// callFailedReport is what the node knows about a call that never reached a gateway: the app
// (Routr's X-App-Ref), but not its workspace.
func callFailedReport(nodeID, callRef string, call IncomingCall, reason string) Event {
	return Event{
		"type":      "call.failed",
		"nodeId":    nodeID,
		"callRef":   callRef,
		"appRef":    call.AppRef,
		"from":      call.From,
		"to":        call.To,
		"direction": orDefault(call.Direction, "inbound"),
		"reason":    reason,
	}
}

// publishCallFailed tells the control plane that a call failed at the node, so the workspace
// gets a call.failed webhook. Calls without an app cannot be attributed and produce nothing.
func (n *Node) publishCallFailed(callRef string, call IncomingCall, reason string) {
	if call.AppRef == "" {
		return
	}
	n.publish(CallFailedSubject(n.cfg.NodeID), callFailedReport(n.cfg.NodeID, callRef, call, reason))
}

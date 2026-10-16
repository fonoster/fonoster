package node

import (
	"crypto/rand"
	"encoding/hex"
	"time"
)

// WebhookEventsSubject is where producers publish workspace webhook events for the control
// plane's fan-out (add-workspace-webhooks 2.2 and 2.4, build log LO-B1).
const WebhookEventsSubject = "webhooks.events"

// callFailedEvent is the v1 `call.failed` envelope for a call that never reached a gateway. The
// node knows the app (Routr's X-App-Ref) but not its workspace, so workspaceRef stays empty and
// the fan-out fills it in from data.appRef.
func callFailedEvent(callRef string, call IncomingCall, reason string, now time.Time) Event {
	var b [16]byte
	_, _ = rand.Read(b[:])
	return Event{
		"id":           "evt_" + hex.EncodeToString(b[:]),
		"type":         "call.failed",
		"createdAt":    now.UTC().Format("2006-01-02T15:04:05.000Z"),
		"workspaceRef": "",
		"data": Event{
			"callRef":   callRef,
			"appRef":    call.AppRef,
			"from":      call.From,
			"to":        call.To,
			"direction": orDefault(call.Direction, "inbound"),
			"reason":    reason,
		},
	}
}

// publishCallFailed tells the workspace that a call failed at the node. Calls without an app
// cannot be attributed to a workspace and produce nothing.
func (n *Node) publishCallFailed(callRef string, call IncomingCall, reason string) {
	if call.AppRef == "" {
		return
	}
	n.publish(WebhookEventsSubject, callFailedEvent(callRef, call, reason, time.Now()))
}

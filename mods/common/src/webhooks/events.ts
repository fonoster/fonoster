/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { createHash, randomUUID } from "crypto";

// Workspace webhook events, v1 (add-workspace-webhooks W2, W3). Every payload uses the envelope
// id, type, createdAt, workspaceRef, data; ids stay the same across retries.

export const WEBHOOK_EVENT_TYPES = [
  "call.started",
  "call.ended",
  "call.failed",
  "call_record.sealed",
  "provider.deprecated"
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

/**
 * Event names of the retired Autopilot agent webhook (`eventsHook`) and what replaces them
 * (add-call-record 7.3). The record of a conversation (transcript, turns, recording) is in the call
 * record that `call_record.sealed` links to.
 */
export const RETIRED_EVENT_TYPES: Record<string, WebhookEventType[]> = {
  "conversation.started": ["call.started"],
  "conversation.ended": ["call.ended", "call_record.sealed"],
  all: ["call.started", "call.ended", "call_record.sealed"]
};

export type WebhookEvent<D = Record<string, unknown>> = {
  id: string;
  type: WebhookEventType;
  createdAt: string;
  workspaceRef: string;
  data: D;
};

type CallParties = {
  callRef: string;
  appRef: string;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
};

function envelope<D>(
  type: WebhookEventType,
  workspaceRef: string,
  data: D,
  id = `evt_${randomUUID()}`,
  now = new Date()
): WebhookEvent<D> {
  return {
    id,
    type,
    createdAt: now.toISOString(),
    workspaceRef,
    data
  };
}

export const callStarted = (workspaceRef: string, call: CallParties) =>
  envelope("call.started", workspaceRef, call);

/**
 * The id of a call's `call.ended`. It depends on the call only, so AppBridge's own `call.ended`
 * and the control plane's `appbridge-lost` one for the same call share it: the fan-out stores one
 * delivery per endpoint (delivery ids depend on the event id) and the first one stored wins.
 * Without a `callRef` there is nothing to tie it to, so the id is random (calls without one must
 * not collapse into one event).
 */
export function callEndedId(callRef: string): string {
  if (!callRef) return `evt_${randomUUID()}`;
  const digest = createHash("sha256")
    .update(`call.ended\n${callRef}`)
    .digest("hex")
    .slice(0, 32);
  return `evt_end_${digest}`;
}

export const callEnded = (
  workspaceRef: string,
  call: CallParties & { durationSeconds: number; endReason: string }
) => envelope("call.ended", workspaceRef, call, callEndedId(call.callRef));

/**
 * A call that never reached an app (busy, no answer, failed, app unreachable), or one that failed
 * mid-call because a vendor rejected the workspace's key (provider_auth_failed).
 */
export const callFailed = (
  workspaceRef: string,
  call: {
    callRef: string;
    appRef?: string;
    from: string;
    to: string;
    direction: "inbound" | "outbound";
    reason: string;
  }
) => envelope("call.failed", workspaceRef, call);

/** Points to the record; never carries the transcript, recording or SIP trace. */
export const callRecordSealed = (
  workspaceRef: string,
  sealed: { callRef: string; version: number; recordUrl: string }
) => envelope("call_record.sealed", workspaceRef, sealed);

export const providerDeprecated = (
  workspaceRef: string,
  d: { id: string; replacement: string; retireOn: string }
) => envelope("provider.deprecated", workspaceRef, d);

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
import { TraceRecord } from "@routr/common/dist/trace";
import { matchesAddress, matchesHost } from "./farEnds";
import { Direction, FarEnd, Match } from "./types";

// The recorded message, typed loosely: only a few fields are read.
interface Message {
  requestUri?: { host?: string };
  from?: { tag?: string };
  to?: { tag?: string };
  via?: { branch?: string; host?: string; received?: string }[];
  extensions?: { name: string; value: string }[];
  body?: string;
}

const msg = (r: TraceRecord) => r.request.message as unknown as Message;
const isRequest = (r: TraceRecord, method: string) =>
  r.kind === "request" && r.method === method;
const isResponse = (r: TraceRecord, method: string) =>
  r.kind === "response" && r.method === method && r.outcome === "relayed";
const is2xx = (r: TraceRecord) =>
  (r.status ?? 0) >= 200 && (r.status ?? 0) < 300;
const isFinal = (r: TraceRecord) => (r.status ?? 0) >= 200;
const toTag = (r: TraceRecord) => msg(r).to?.tag ?? "";
const fromTag = (r: TraceRecord) => msg(r).from?.tag ?? "";
const hasBody = (r: TraceRecord) => (msg(r).body ?? "").trim().length > 0;

// The address a request came from. Routr records the top Via's sent-by as the
// sender, which the sender writes; the received parameter is the packet's real
// source, added whenever it differs from sent-by (RFC 3261 §18.2.1).
const sourceAddress = (r: TraceRecord) =>
  msg(r).via?.[0]?.received || r.request.sender.host;

// Headers by full or compact name (RFC 3261 §7.3.3), case-insensitive.
function header(r: TraceRecord, ...names: string[]): string | undefined {
  const wanted = names.map((n) => n.toLowerCase());
  return msg(r).extensions?.find((e) => wanted.includes(e.name.toLowerCase()))
    ?.value;
}

// Retransmissions: one record per (kind, method, status, top Via branch).
function dedupe(records: TraceRecord[]): TraceRecord[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    const key = [r.kind, r.method, r.status, msg(r).via?.[0]?.branch].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addedHeader(r: TraceRecord, name: string): string | undefined {
  const entry = (r.hops ?? [])
    .flatMap((hop) => Object.entries(hop.diff?.headers?.added ?? {}))
    .find(([k]) => k.toLowerCase() === name.toLowerCase());
  return entry?.[1];
}

const URI_HOST = /^sips?:(?:[^@]*@)?(\[[^\]]+\]|[^:;>?]+)/i;

function forwardedHost(r: TraceRecord): string | undefined {
  const host = (r.hops ?? [])
    .map((hop) => URI_HOST.exec(hop.diff?.requestUri?.to ?? "")?.[1])
    .find(Boolean);
  return host ?? msg(r).requestUri?.host;
}

const DIRECTIONS: Record<string, Direction> = {
  "from-pstn": "inbound",
  "peer-to-pstn": "outbound",
  "agent-to-pstn": "outbound"
};

// What the recording shows, read once for every case.
interface Facts {
  direction: Direction;
  callDirection: string;
  answered: boolean;
  acked: boolean;
  byeOk: boolean;
  byeFromCaller: boolean;
  byeFromCallee: boolean;
  cancelled: boolean;
  cancelledBySender: boolean;
  finalStatus?: number;
  reInviteWithSdp: boolean;
  reInviteWithoutSdp: boolean;
  referred: boolean;
}

function readFacts(records: TraceRecord[], invite: TraceRecord, i0: number) {
  const after = records.slice(i0 + 1);
  const callerTag = fromTag(invite);
  const firstReInvite = after.findIndex(
    (r) => isRequest(r, "INVITE") && toTag(r) !== ""
  );
  const beforeReInvite =
    firstReInvite < 0 ? after : after.slice(0, firstReInvite);
  const finals = beforeReInvite.filter(
    (r) => isResponse(r, "INVITE") && isFinal(r)
  );
  const answeredAt = after.findIndex(
    (r, i) =>
      isResponse(r, "INVITE") &&
      is2xx(r) &&
      (firstReInvite < 0 || i < firstReInvite)
  );
  const answered = answeredAt >= 0;
  const acked =
    answered && after.slice(answeredAt + 1).some((r) => isRequest(r, "ACK"));
  const byes = after.filter((r) => isRequest(r, "BYE"));
  const cancels = after.filter((r) => isRequest(r, "CANCEL"));
  const sender = sourceAddress(invite);

  // A re-INVITE inside the dialog, answered with a 2xx after it.
  const reInvites = after
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r, i }) =>
        isRequest(r, "INVITE") && toTag(r) !== "" && acked && i > answeredAt
    );
  const answeredLater = (i: number) =>
    after.slice(i + 1).find((r) => isResponse(r, "INVITE") && is2xx(r));
  const reInviteWithSdp = reInvites.some(
    ({ r, i }) => hasBody(r) && !!answeredLater(i)
  );
  const reInviteWithoutSdp = reInvites.some(({ r, i }) => {
    if (hasBody(r)) return false;
    const ok = answeredLater(i);
    if (!ok || !hasBody(ok)) return false;
    const okAt = after.indexOf(ok);
    return after.slice(okAt + 1).some((x) => isRequest(x, "ACK") && hasBody(x));
  });

  const referred =
    after.some((r) => isRequest(r, "REFER") && !!header(r, "Refer-To", "r")) &&
    after.some((r) => isResponse(r, "REFER") && r.status === 202) &&
    after.some(
      (r) =>
        isRequest(r, "NOTIFY") &&
        (header(r, "Event", "o") ?? "").trim().toLowerCase().startsWith("refer")
    );

  return {
    answered,
    acked,
    byeOk: after.some((r) => isResponse(r, "BYE") && is2xx(r)),
    byeFromCaller: byes.some((r) => fromTag(r) === callerTag),
    byeFromCallee: byes.some((r) => fromTag(r) !== callerTag),
    cancelled: cancels.length > 0,
    cancelledBySender: cancels.some((r) => sourceAddress(r) === sender),
    finalStatus: finals.length ? finals[finals.length - 1].status : undefined,
    reInviteWithSdp,
    reInviteWithoutSdp,
    referred
  };
}

const answeredCall = (f: Facts) => f.answered && f.acked && f.byeOk;
const inbound = (f: Facts) => f.direction === "inbound";
const outbound = (f: Facts) => f.direction === "outbound";

/** The interop cases, in id order. When several match, the highest id wins. */
export const CASES: ReadonlyArray<{
  id: string;
  name: string;
  matches: (f: Facts) => boolean;
}> = [
  {
    id: "IOP-001",
    name: "Inbound call to a Number answered, caller hangs up",
    matches: (f) => inbound(f) && answeredCall(f) && f.byeFromCaller
  },
  {
    id: "IOP-002",
    name: "Inbound call answered, Fonoster hangs up",
    matches: (f) => inbound(f) && answeredCall(f) && f.byeFromCallee
  },
  {
    id: "IOP-003",
    name: "Outbound call from an app answered",
    matches: (f) => f.callDirection === "peer-to-pstn" && answeredCall(f)
  },
  {
    id: "IOP-004",
    name: "SIP agent outbound call answered",
    matches: (f) => f.callDirection === "agent-to-pstn" && answeredCall(f)
  },
  {
    id: "IOP-005",
    name: "Outbound call cancelled before answer",
    matches: (f) => outbound(f) && f.cancelled && !f.answered
  },
  {
    id: "IOP-006",
    name: "Inbound call cancelled by the caller",
    matches: (f) => inbound(f) && f.cancelledBySender && !f.answered
  },
  {
    id: "IOP-007",
    name: "Outbound call busy",
    matches: (f) => outbound(f) && f.finalStatus === 486
  },
  {
    id: "IOP-008",
    name: "Outbound call declined",
    matches: (f) => outbound(f) && f.finalStatus === 603
  },
  {
    id: "IOP-009",
    name: "In-dialog re-INVITE with SDP answered",
    matches: (f) => f.reInviteWithSdp
  },
  {
    id: "IOP-010",
    name: "In-dialog re-INVITE without SDP",
    matches: (f) => f.reInviteWithoutSdp
  },
  {
    id: "IOP-011",
    name: "Blind transfer by REFER",
    matches: (f) => f.referred
  }
];

/**
 * Decides which far end and interop case a recorded call shows, or null when
 * it shows none. Only fields a caller can't forge decide the far end: the
 * Request-URI host Routr routed on and the address the INVITE came from.
 */
export function classifyCall(
  records: TraceRecord[],
  farEnds: FarEnd[]
): Match | null {
  const call = dedupe(records);
  const i0 = call.findIndex(
    (r) =>
      isRequest(r, "INVITE") && toTag(r) === "" && r.outcome === "forwarded"
  );
  if (i0 < 0) return null;
  const invite = call[i0];
  const callDirection = addedHeader(invite, "X-Call-Direction") ?? "";
  const direction = DIRECTIONS[callDirection];
  if (!direction) return null;

  const farEnd =
    direction === "outbound"
      ? farEnds.find((f) => matchesHost(f, forwardedHost(invite)))
      : farEnds.find(
          (f) =>
            matchesHost(f, msg(invite).requestUri?.host) ||
            matchesAddress(f, sourceAddress(invite))
        );
  if (!farEnd) return null;

  const facts: Facts = {
    direction,
    callDirection,
    ...readFacts(call, invite, i0)
  };
  const hit = [...CASES].reverse().find((c) => c.matches(facts));
  return hit ? { farEnd: farEnd.name, case: hit.id, direction } : null;
}

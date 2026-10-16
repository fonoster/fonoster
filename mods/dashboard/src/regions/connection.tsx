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
import { CopyField } from "~/components/data/copy-field";
import { useConnection, usePrivateRegions } from "~/lib/capabilities";
import { useRegion } from "./api";
import type { RegionDetail, RegionEndpoints, SipTransport } from "./types";

type Sip = RegionEndpoints["sip"][number];

const CARRIER_ORDER: SipTransport[] = ["udp", "tcp", "tls"];
const PHONE_ORDER: SipTransport[] = ["udp", "tcp", "tls", "wss", "ws"];

export const hostPort = (s: Sip) => `${s.host}:${s.port}`;
export const transportLabel = (t: SipTransport) => t.toUpperCase();

/** The SIP endpoint to suggest first, by transport preference. */
export function preferredSip(
  endpoints: RegionEndpoints | undefined,
  order: SipTransport[]
): Sip | undefined {
  const sip = endpoints?.sip ?? [];
  for (const t of order) {
    const hit = sip.find((s) => s.transport === t);
    if (hit) return hit;
  }
  return undefined;
}

/** Signaling and media addresses, without repeats. */
export function allowlist(endpoints: RegionEndpoints | undefined): string[] {
  return [
    ...new Set([
      ...(endpoints?.signalingAddresses ?? []),
      ...(endpoints?.mediaAddresses ?? [])
    ])
  ];
}

const hasDetails = (e?: RegionEndpoints) =>
  !!e && (e.sip.length > 0 || allowlist(e).length > 0);

/**
 * The current workspace's connection details. With private regions, its region's (public or
 * private, from the regions API). Without them the regions API is not mounted, so they come from
 * GetCapabilities: the deployment's default public region.
 */
export function useEndpoints(): RegionEndpoints | undefined {
  const privateRegions = usePrivateRegions();
  const { data } = useRegion();
  const deployment = useConnection();
  const endpoints = privateRegions ? data?.endpoints : deployment;
  return hasDetails(endpoints) ? endpoints : undefined;
}

/** Settings → Region: SIP addresses, addresses to allowlist and RTP ports, each copyable. */
export function ConnectionDetails({ region }: { region?: RegionDetail }) {
  const e = region?.endpoints;
  if (!hasDetails(e)) {
    if (region?.kind !== "private") return null;
    return (
      <section aria-label="Connection details" className="flex flex-col gap-2">
        <h3 className="text-sm font-medium">Connection details</h3>
        <p className="font-display text-[13px] text-muted-foreground">
          Shown once your region connects.
        </p>
      </section>
    );
  }
  const addresses = allowlist(e);
  return (
    <section aria-label="Connection details" className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Connection details</h3>
      {e!.sip.map((s) => (
        <CopyField
          key={`${s.transport}-${hostPort(s)}`}
          label={`SIP (${transportLabel(s.transport)})`}
          value={hostPort(s)}
        />
      ))}
      {addresses.length > 0 && (
        <CopyField
          label="Addresses to allowlist"
          value={addresses.join(", ")}
        />
      )}
      {e!.rtpPorts && (
        <CopyField
          label="RTP ports"
          value={`${e!.rtpPorts.min}-${e!.rtpPorts.max}`}
        />
      )}
    </section>
  );
}

/** One line on the trunk form: where the carrier sends calls and what to allowlist. */
export function CarrierHint() {
  const e = useEndpoints();
  const sip = preferredSip(e, CARRIER_ORDER);
  if (!sip) return null;
  const addresses = allowlist(e);
  return (
    <p
      data-testid="carrier-hint"
      className="font-display text-[13px] text-muted-foreground"
    >
      Point your carrier at{" "}
      <code className="text-foreground">{hostPort(sip)}</code> (
      {transportLabel(sip.transport)})
      {addresses.length > 0 && (
        <>
          ; allowlist{" "}
          <code className="text-foreground">{addresses.join(", ")}</code>
        </>
      )}
      .
    </p>
  );
}

/** SIP agent settings: what to type into a softphone. */
export function SoftphoneSettings() {
  const sip = preferredSip(useEndpoints(), PHONE_ORDER);
  if (!sip) return null;
  return (
    <section aria-label="Softphone settings" className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">Softphone settings</h3>
      <CopyField label="Server" value={sip.host} />
      <div className="grid grid-cols-2 gap-4">
        <CopyField label="Port" value={String(sip.port)} />
        <CopyField label="Transport" value={transportLabel(sip.transport)} />
      </div>
    </section>
  );
}

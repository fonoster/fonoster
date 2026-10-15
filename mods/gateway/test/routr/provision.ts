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
import { CommonTypes as CT } from "@routr/common";
import SDK from "@routr/sdk";

// Routr resources for a media node behind Routr (add-media-node 4.1): Credentials + Peer (the
// node's AOR, least-sessions) + Trunk (inbound URI) + Number (aorLink = the peer's AOR, X-App-Ref).
// Idempotent: existing resources with the same names are reused, so a rig can run many times.

export type MediaNodeRouting = {
  /** The peer AOR media nodes register under (Numbers point here). */
  aor: string;
  username: string;
  password: string;
  /** The host a carrier puts in the Request-URI; Routr finds the Trunk by it. */
  inboundUri: string;
  /** E.164 number, e.g. +17853178070. */
  number: string;
  appRef: string;
};

export type Provisioned = {
  credentialsRef: string;
  peerRef: string;
  trunkRef: string;
  numberRef: string;
};

type Named = { ref: string; name?: string; username?: string };

async function listAll<T extends Named>(
  list: (r: {
    pageSize: number;
    pageToken?: string;
  }) => Promise<{ items: T[]; nextPageToken?: string }>
): Promise<T[]> {
  const out: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await list({ pageSize: 100, pageToken });
    out.push(...page.items);
    pageToken = page.nextPageToken || undefined;
  } while (pageToken);
  return out;
}

export async function provisionMediaNodeRouting(
  endpoint: string,
  r: MediaNodeRouting
): Promise<Provisioned> {
  const opts = { endpoint, insecure: true };
  const credentials = new SDK.Credentials(opts);
  const peers = new SDK.Peers(opts);
  const trunks = new SDK.Trunks(opts);
  const numbers = new SDK.Numbers(opts);

  const credName = `${r.username} credentials`;
  const existingCred = (
    await listAll((q) => credentials.listCredentials(q) as never)
  ).find((c) => c.name === credName);
  const cred = existingCred
    ? await credentials.updateCredentials({
        ref: existingCred.ref,
        name: credName,
        username: r.username,
        password: r.password
      } as never)
    : await credentials.createCredentials({
        name: credName,
        username: r.username,
        password: r.password
      });

  const peer =
    (await listAll((q) => peers.listPeers(q) as never)).find(
      (p) => p.username === r.username
    ) ??
    (await peers.createPeer({
      name: "Media nodes",
      username: r.username,
      aor: r.aor,
      credentialsRef: cred.ref,
      balancingAlgorithm: CT.LoadBalancingAlgorithm.LEAST_SESSIONS,
      withSessionAffinity: false,
      // Every node registers under the same AOR.
      maxContacts: -1,
      enabled: true
    } as never));

  const trunkName = `trunk ${r.inboundUri}`;
  const trunk =
    (await listAll((q) => trunks.listTrunks(q) as never)).find(
      (t) => t.name === trunkName
    ) ??
    (await trunks.createTrunk({
      name: trunkName,
      inboundUri: r.inboundUri,
      sendRegister: false,
      uris: []
    } as never));

  const telUrl = `tel:${r.number}`;
  const existing = (await listAll((q) => numbers.listNumbers(q) as never)).find(
    (n) => (n as unknown as { telUrl: string }).telUrl === telUrl
  );
  const extraHeaders = [{ name: "X-App-Ref", value: r.appRef }];
  const number = existing
    ? await numbers.updateNumber({
        ref: existing.ref,
        name: `rig ${r.number}`,
        aorLink: r.aor,
        trunkRef: trunk.ref,
        extraHeaders
      } as never)
    : await numbers.createNumber({
        name: `rig ${r.number}`,
        telUrl,
        aorLink: r.aor,
        trunkRef: trunk.ref,
        city: "Rig",
        country: "United States",
        countryIsoCode: "US",
        extraHeaders
      } as never);

  return {
    credentialsRef: cred.ref,
    peerRef: peer.ref,
    trunkRef: trunk.ref,
    numberRef: number.ref
  };
}

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
import { NatsConnection, StringCodec } from "nats";
import { issueUserCreds, keyPairFromSeed, regionsAccountJwt } from "./natsJwt";
import { subjects } from "./types";

const sc = StringCodec();

/**
 * Issues and revokes the cells' NATS users on the region hub (RG-B2). Users are signed by the
 * REGIONS account key and allowed `region.<ref>.>` only; revoking re-signs the REGIONS account
 * with the user in `revocations` and pushes it over the system account, which disconnects it.
 */
export function createRegionNatsAuth(options: {
  operatorSeed: string;
  accountSeed: string;
  /** A connection as a system-account user of the hub; needed to revoke. */
  system?: NatsConnection;
  timeoutMs?: number;
}) {
  const operator = keyPairFromSeed(options.operatorSeed);
  const account = keyPairFromSeed(options.accountSeed);
  const accountPublicKey = account.getPublicKey();

  return {
    accountPublicKey,
    issue(regionRef: string) {
      const scope = subjects(regionRef).all;
      return issueUserCreds(account, regionRef, { pub: [scope], sub: [scope] });
    },
    /** Pushes the REGIONS account with every revoked user (public key → revoked-before time). */
    async pushRevocations(revocations: Record<string, number>) {
      if (!options.system)
        throw new Error("region hub: no system connection to push revocations");
      const jwt = regionsAccountJwt(operator, accountPublicKey, revocations);
      const reply = await options.system.request(
        "$SYS.REQ.CLAIMS.UPDATE",
        sc.encode(jwt),
        { timeout: options.timeoutMs ?? 5000 }
      );
      const body = JSON.parse(sc.decode(reply.data)) as {
        data?: { code?: number; message?: string };
        error?: { code?: number; description?: string };
      };
      if (body.error || (body.data?.code && body.data.code !== 200))
        throw new Error(
          `region hub refused the account update: ${body.error?.description ?? body.data?.message}`
        );
    }
  };
}

export type RegionNatsAuth = ReturnType<typeof createRegionNatsAuth>;

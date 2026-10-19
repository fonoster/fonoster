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
import * as fs from "fs";
import {
  FileKeyCustody,
  KeyCustody,
  StaticKeyCustody
} from "@fonoster/callrecord";
import { AppBridgeConfig } from "../config";

/**
 * The region's key custody from `callRecord.signingKey` (task 2.6, LO-B5): `dir` is a key
 * directory managed with `fonoster-callrecord keys rotate`; `kid` + `privateKeyFile` is one fixed
 * key. `keyHistory` public keys are published in both cases.
 */
export function keyCustody(
  c: NonNullable<AppBridgeConfig["callRecord"]>
): KeyCustody {
  const earlier: Record<string, string> = {};
  for (const k of c.keyHistory ?? [])
    earlier[k.kid] = fs.readFileSync(k.publicKeyFile, "utf8");
  const k = c.signingKey;
  if (k.dir) {
    const files = new FileKeyCustody(k.dir, { jku: k.jku });
    return {
      current: () => files.current(),
      sign: (kid, input) => files.sign(kid, input),
      publicKeys: () => ({ ...earlier, ...files.publicKeys() })
    };
  }
  return new StaticKeyCustody(
    {
      kid: k.kid!,
      privateKeyPem: fs.readFileSync(k.privateKeyFile!, "utf8"),
      jku: k.jku
    },
    earlier
  );
}

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
import { URLSearchParams } from "url";

type Json = Record<string, unknown>;

/**
 * Parses Stripe's form encoding (application/x-www-form-urlencoded with bracket keys, as the Stripe
 * SDKs send it): `a[b]=1`, `items[0][price]=p`, `expand[]=x`. Values stay strings, as on the wire.
 */
export function parseForm(body: string): Json {
  const out: Json = {};
  new URLSearchParams(body).forEach((value, rawKey) => {
    const parts = rawKey.replace(/\]/g, "").split("[");
    let node: Json | unknown[] = out;
    parts.forEach((part, i) => {
      const last = i === parts.length - 1;
      const nextIsIndex =
        !last && (parts[i + 1] === "" || /^\d+$/.test(parts[i + 1]));
      const container = node as Record<string, unknown> & unknown[];
      const key: string | number = Array.isArray(node)
        ? part === ""
          ? node.length
          : Number(part)
        : part;
      if (last) {
        container[key as never] = value as never;
        return;
      }
      if (container[key as never] === undefined)
        container[key as never] = (nextIsIndex ? [] : {}) as never;
      node = container[key as never] as Json | unknown[];
    });
  });
  return out;
}

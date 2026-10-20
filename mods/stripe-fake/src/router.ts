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
import { Json, StripeFake } from "./fake";

export type Ctx = {
  fake: StripeFake;
  /** Path parameters by the OpenAPI template's names. */
  params: Record<string, string>;
  /** The form body (POST) or query (GET), parsed. */
  body: Json;
};

export type Handler = (ctx: Ctx) => Json | Promise<Json>;

export type Route = {
  method: "get" | "post" | "delete";
  path: string;
  handler: Handler;
};

/** Stripe-style list: `{object: "list", data, has_more, url}`, newest first, `limit` (default 10). */
export function list(url: string, items: Json[], body: Json): Json {
  const limit = Math.min(Number(body.limit ?? 10), 100);
  // Insertion order breaks ties, so objects made in the same second still list newest first.
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort(
      (a, b) =>
        (b.item.created as number) - (a.item.created as number) || b.i - a.i
    )
    .map(({ item }) => item);
  const after = body.starting_after as string | undefined;
  const start = after ? sorted.findIndex((i) => i.id === after) + 1 : 0;
  return {
    object: "list",
    data: sorted.slice(start, start + limit),
    has_more: sorted.length > start + limit,
    url
  };
}

export const int = (v: unknown, fallback?: number): number | undefined =>
  v === undefined || v === "" ? fallback : Number(v);

export const metadataOf = (body: Json, previous: Json = {}): Json => {
  const m = body.metadata as Json | "" | undefined;
  if (m === "") return {};
  return m ? { ...previous, ...m } : previous;
};

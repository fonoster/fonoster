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
import type { Delivery, FakeState, Obj } from "../api";
import { Muted } from "../ui";

export type ScreenProps = {
  state: FakeState;
  /** Runs a control or API call, showing its error if it fails. */
  run: (action: () => Promise<unknown>) => void;
  /** The customer the Customers screen shows and the controls act on. */
  customer?: Obj;
  selectCustomer: (id: string) => void;
};

/** A delivery's state as its last attempt left it: 200, 500 retrying, pending. */
export function DeliveryStatus({ d }: { d: Delivery }) {
  const last = d.attempts[d.attempts.length - 1];
  if (!last) return <Muted>pending</Muted>;
  const ok = last.status >= 200 && last.status < 300;
  if (ok) return <Muted>{last.status}</Muted>;
  const code = last.status || "no answer";
  return <Muted danger>{d.done ? `${code} failed` : `${code} retrying`}</Muted>;
}

/** The customer an event is about: the object's `customer`, or the customer itself. */
export function eventCustomer(event?: Obj): string | undefined {
  const object = event?.data?.object;
  if (!object) return undefined;
  return object.object === "customer" ? object.id : object.customer;
}

export const eventsById = (state: FakeState) =>
  new Map(state.events.map((e) => [e.id as string, e]));

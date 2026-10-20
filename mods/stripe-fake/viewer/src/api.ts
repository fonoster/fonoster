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
import { useCallback, useEffect, useRef, useState } from "react";

// Stripe objects as the fake keeps them; the viewer reads the few fields it shows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Obj = Record<string, any>;

export type MeterEvent = {
  identifier: string;
  eventName: string;
  meter?: string;
  customer?: string;
  value: number;
  timestamp: number;
  received: number;
  status: "accepted" | "rejected" | "canceled";
  error?: string;
};

export type Delivery = {
  id: string;
  event: string;
  endpoint: string;
  url: string;
  attempts: { at: number; status: number; error?: string }[];
  nextAt?: number;
  done: boolean;
};

/** `GET /_fake/state`: everything the viewer shows. */
export type FakeState = {
  now: number;
  balances: Record<
    string,
    { promotional: number; paid: number; available: number }
  >;
  grantRemaining: Record<string, number>;
  clocks: Obj[];
  customers: Obj[];
  prices: Obj[];
  paymentMethods: Obj[];
  subscriptions: Obj[];
  invoices: Obj[];
  meters: Obj[];
  meterEvents: MeterEvent[];
  creditGrants: Obj[];
  creditTransactions: Obj[];
  events: Obj[];
  deliveries: Delivery[];
  control: {
    failWebhooks: number;
    latencyMs: number;
    rateLimit: boolean;
    nextPayment: Record<string, string>;
  };
};

async function call(method: string, path: string, body?: object) {
  const res = await fetch(path, {
    method,
    headers: {
      "content-type": "application/json",
      // The Stripe API wants a test key; the fake accepts any.
      authorization: "Bearer sk_test_viewer"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message ?? res.statusText);
  return json;
}

/** The control API (`/_fake`): advance the clock, force outcomes, reset, replay. */
export const control = (path: string, body: object = {}) =>
  call("POST", `/_fake/${path}`, body);

/** A Stripe API call, as a client would make it. */
export const stripeCall = (path: string) => call("POST", path);

/**
 * The fake's state, kept current: loaded once, then again whenever the fake reports a change on
 * its WebSocket (debounced, since one request can change many objects).
 */
export function useFakeState() {
  const [state, setState] = useState<FakeState>();
  const [error, setError] = useState<string>();
  const [live, setLive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(() => {
    fetch("/_fake/state")
      .then((r) => r.json())
      .then((s: FakeState) => {
        setState(s);
        setError(undefined);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    let socket: WebSocket | undefined;
    let closed = false;
    const connect = () => {
      const url = new URL("/_fake/ws", location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      socket = new WebSocket(url);
      socket.onopen = () => {
        setLive(true);
        load();
      };
      socket.onmessage = () => {
        clearTimeout(timer.current);
        timer.current = setTimeout(load, 80);
      };
      socket.onclose = () => {
        setLive(false);
        if (!closed) setTimeout(connect, 1000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer.current);
      socket?.close();
    };
  }, [load]);

  return { state, error, live, reload: load };
}

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
import WebSocket from "ws";

export type Frame =
  | { kind: "json"; at: number; data: Record<string, unknown> }
  | { kind: "binary"; at: number; data: Buffer }
  | { kind: "text"; at: number; data: string };

/**
 * The runner's view of the implementation under test: frames go out, frames come in. A peer
 * knows nothing about scenarios, so the same runner drives a WebSocket, an in-memory pair or a
 * NATS subject.
 */
export interface Peer {
  sendJson(data: Record<string, unknown>): void;
  sendBinary(data: Buffer): void;
  close(code?: number, reason?: string): void;
  readonly frames: FrameLog;
  /**
   * The channel a JSON frame (or an expect pattern) belongs to, for peers that merge sources
   * with no order between them: the runner then keeps one expect cursor per channel.
   */
  channel?(data: Record<string, unknown>): string;
}

type Waiter = () => void;

/** Every frame a peer received, in arrival order, with arrival times. */
export class FrameLog {
  readonly items: Frame[] = [];
  closed?: { at: number; code?: number; reason?: string };
  private waiters = new Set<Waiter>();

  push(frame: Frame) {
    this.items.push(frame);
    this.notify();
  }

  markClosed(code?: number, reason?: string) {
    if (!this.closed) {
      this.closed = { at: Date.now(), code, reason };
      this.notify();
    }
  }

  private notify() {
    for (const w of [...this.waiters]) w();
  }

  /**
   * Resolves when `check` returns a value other than undefined, re-running it on every new
   * frame or close, or resolves undefined at the deadline.
   */
  waitUntil<T>(
    check: () => T | undefined,
    deadline: number
  ): Promise<T | undefined> {
    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (value: T | undefined) => {
        this.waiters.delete(waiter);
        if (timer) clearTimeout(timer);
        resolve(value);
      };
      const waiter = () => {
        const v = check();
        if (v !== undefined) finish(v);
      };
      const first = check();
      if (first !== undefined) return resolve(first);
      this.waiters.add(waiter);
      timer = setTimeout(
        () => finish(check()),
        Math.max(0, deadline - Date.now())
      );
    });
  }
}

function toFrame(raw: WebSocket.Data, isBinary: boolean): Frame {
  const at = Date.now();
  if (isBinary) {
    const data = Buffer.isBuffer(raw)
      ? raw
      : Array.isArray(raw)
        ? Buffer.concat(raw)
        : Buffer.from(raw as ArrayBuffer);
    return { kind: "binary", at, data };
  }
  const text = raw.toString();
  try {
    const data = JSON.parse(text);
    if (typeof data === "object" && data !== null && !Array.isArray(data)) {
      return { kind: "json", at, data };
    }
  } catch {
    // Not JSON: kept as text so a scenario can fail on it with a clear reason.
  }
  return { kind: "text", at, data: text };
}

/** A peer over an open WebSocket. */
export class WebSocketPeer implements Peer {
  readonly frames = new FrameLog();

  constructor(readonly socket: WebSocket) {
    socket.on("message", (raw: WebSocket.Data, isBinary?: boolean) => {
      // ws 8 passes isBinary; older versions deliver text as strings.
      const binary = isBinary ?? typeof raw !== "string";
      this.frames.push(toFrame(raw, binary));
    });
    socket.on("close", (code: number, reason: Buffer | string) =>
      this.frames.markClosed(code, reason?.toString())
    );
    socket.on("error", () => this.frames.markClosed());
  }

  sendJson(data: Record<string, unknown>) {
    this.socket.send(JSON.stringify(data));
  }

  sendBinary(data: Buffer) {
    this.socket.send(data, { binary: true });
  }

  close(code = 1000, reason?: string) {
    this.socket.close(code, reason);
  }
}

/**
 * A peer for a session that never reached an app (unreachable app, refused signature, busy
 * callee): nothing arrives and nothing can be sent, so such scenarios only `wait` and `assert`.
 */
export class DetachedPeer implements Peer {
  readonly frames = new FrameLog();

  sendJson(): void {
    throw new Error(
      "no app session: this scenario's call never reached an app"
    );
  }

  sendBinary(): void {
    throw new Error(
      "no app session: this scenario's call never reached an app"
    );
  }

  close(code = 1000, reason?: string) {
    this.frames.markClosed(code, reason);
  }
}

/** Two peers wired to each other in memory; useful for testing runners and fakes. */
export function peerPair(): [Peer, Peer] {
  const make = (): Peer & { other?: Peer & { frames: FrameLog } } => ({
    frames: new FrameLog(),
    sendJson(data) {
      const target = this.other!;
      setImmediate(() =>
        target.frames.push({
          kind: "json",
          at: Date.now(),
          data: JSON.parse(JSON.stringify(data))
        })
      );
    },
    sendBinary(data) {
      const target = this.other!;
      setImmediate(() =>
        target.frames.push({
          kind: "binary",
          at: Date.now(),
          data: Buffer.from(data)
        })
      );
    },
    close(code = 1000, reason) {
      const target = this.other!;
      setImmediate(() => {
        target.frames.markClosed(code, reason);
        this.frames.markClosed(code, reason);
      });
    }
  });
  const a = make();
  const b = make();
  a.other = b;
  b.other = a;
  return [a, b];
}

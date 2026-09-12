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
import { EventEmitter } from "events";
import * as net from "net";

/**
 * Thrown when the channel hangs up (or the socket closes) while a command is
 * in flight, or when a command is attempted on an already-hung-up channel.
 */
class AgiHangupError extends Error {
  constructor(message = "AGI channel hung up") {
    super(message);
    this.name = "AgiHangupError";
  }
}

type PendingCommand = {
  resolve: (value: void) => void;
  reject: (reason: Error) => void;
};

/**
 * One FastAGI session. Minimal, hand-rolled client for the handful of
 * commands this module needs (EXEC, SET VARIABLE) — see AgiServer.ts for why
 * this exists instead of a dependency: the only maintained npm package for
 * this protocol (`asteriskagi`) shipped a broken `require()` in its latest
 * release at the time this was written.
 *
 * The AGI protocol is a simple line-based request/response: write one
 * command line, read back one `200 result=...` line. Asterisk may also send
 * an unsolicited `HANGUP` line at any time if the channel hangs up mid-command.
 */
class AgiChannel extends EventEmitter {
  readonly channel: string;
  readonly uniqueid: string;
  // Every agi_* header Asterisk sent, keyed without the "agi_" prefix (e.g.
  // "arg_1", "channel", "uniqueid") — see `args` below for the common case of
  // reading dialplan-supplied AGI() arguments.
  readonly variables: Record<string, string>;

  private socket: net.Socket;
  private buffer = "";
  private ended = false;
  private pending?: PendingCommand;

  constructor(props: {
    socket: net.Socket;
    variables: Record<string, string>;
  }) {
    super();
    this.socket = props.socket;
    this.variables = props.variables;
    this.channel = props.variables.channel ?? "";
    this.uniqueid = props.variables.uniqueid ?? "";

    this.socket.on("data", this.onData);
    this.socket.once("end", () => this.end());
    this.socket.once("close", () => this.end());
    this.socket.once("error", (err) => this.end(err));
  }

  get hungup(): boolean {
    return this.ended;
  }

  /**
   * Dialplan arguments passed after the AGI URI, e.g.
   * `AGI(agi://amdanalyser:4573,${AMD_MODE})` arrives as `agi_arg_1`, read
   * here as `args[0]`. Standard AGI behavior, same for FastAGI as for a
   * local script.
   */
  get args(): string[] {
    const result: string[] = [];
    for (let i = 1; this.variables[`arg_${i}`] !== undefined; i++) {
      result.push(this.variables[`arg_${i}`]);
    }
    return result;
  }

  private onData = (data: Buffer) => {
    if (this.ended) return;

    this.buffer += data.toString();
    let newline = this.buffer.indexOf("\n");
    while (newline >= 0) {
      const line = this.buffer.slice(0, newline).replace(/\r$/, "").trim();
      this.buffer = this.buffer.slice(newline + 1);
      if (line === "HANGUP") {
        this.end();
        return;
      }
      if (line) this.resolvePending(line);
      newline = this.buffer.indexOf("\n");
    }
  };

  private resolvePending(line: string) {
    const pending = this.pending;
    if (!pending) return;
    this.pending = undefined;

    // "200 result=1 ..." on success; "5xx ..." or a negative result on
    // failure — either way this only needs to settle the promise, not parse
    // the (unused) payload.
    const match = line.match(/^\d+\s+result=(-?\d+)/);
    const result = match ? Number(match[1]) : NaN;
    if (line.startsWith("2") && !(Number.isFinite(result) && result < 0)) {
      pending.resolve();
    } else {
      pending.reject(new Error(`AGI command failed: ${line}`));
    }
  }

  private end(cause?: Error) {
    if (this.ended) return;
    this.ended = true;
    this.socket.off("data", this.onData);

    const pending = this.pending;
    this.pending = undefined;
    pending?.reject(new AgiHangupError());

    if (!this.socket.destroyed) this.socket.end();
    this.emit("hangup", cause);
  }

  /** Sends one raw FastAGI command line and waits for its response. */
  send(command: string): Promise<void> {
    if (this.ended) return Promise.reject(new AgiHangupError());
    if (this.pending) {
      return Promise.reject(new Error("An AGI command is already in progress"));
    }

    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
      if (!this.socket.writable || this.socket.destroyed) {
        this.end();
        return;
      }
      this.socket.write(command + "\n", "utf8", (err) => {
        if (err) this.end(err);
      });
    });
  }

  /** Runs a dialplan application via `EXEC`, e.g. `exec("AudioSocket", args)`. */
  exec(application: string, args?: string): Promise<void> {
    return this.send(`EXEC ${application} ${args ?? ""}`);
  }

  setVariable(name: string, value: string): Promise<void> {
    return this.send(`SET VARIABLE ${name} "${value}"`);
  }

  /**
   * Ends the AGI session cleanly once this side is done issuing commands.
   * This — not a special "done" command — is how Asterisk's AGI() app knows
   * to return control to the dialplan: it detects the AGI script closing the
   * connection. Without this, a real channel would sit in AGI() forever.
   * Distinct from `end()`'s hangup semantics: this is *us* finishing, not
   * the far end going away, so it doesn't emit "hangup".
   */
  close(): void {
    if (this.ended) return;
    this.ended = true;
    this.socket.off("data", this.onData);

    // A command can still be in flight (e.g. the caller gave up on it via an
    // external race/timeout rather than waiting for a response) — settle it
    // so that awaiter doesn't hang forever, same as end()'s hangup path.
    const pending = this.pending;
    this.pending = undefined;
    pending?.reject(new AgiHangupError("AGI session closed locally"));

    if (!this.socket.destroyed) this.socket.end();
  }
}

export { AgiChannel, AgiHangupError };

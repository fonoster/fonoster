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
import * as path from "path";

// voice-session, "Every message is part of the call record". The call record itself (vCon,
// sealing, signing, storage) is add-call-record; the gateway only appends entries through this
// interface.

export type RecordEntry = {
  at: number;
  /** "app" = sent by the app, "gateway" = sent to the app, "event" = gateway-side event. */
  source: "app" | "gateway" | "event";
  message: Record<string, unknown>;
};

export interface CallRecordSink {
  append(callRef: string, entry: RecordEntry): void;
  /** The call has ended; nothing more will be appended for it. */
  close(callRef: string): void;
}

/** Keeps entries in memory; for tests and development. */
export class MemoryCallRecordSink implements CallRecordSink {
  readonly records = new Map<string, RecordEntry[]>();
  readonly closed = new Set<string>();

  append(callRef: string, entry: RecordEntry) {
    const list = this.records.get(callRef) ?? [];
    list.push(entry);
    this.records.set(callRef, list);
  }

  close(callRef: string) {
    this.closed.add(callRef);
  }
}

/** Appends one JSON line per entry to <dir>/<callRef>.jsonl, so a crash keeps what was written. */
export class JsonlCallRecordSink implements CallRecordSink {
  constructor(private readonly dir: string) {
    fs.mkdirSync(dir, { recursive: true });
  }

  append(callRef: string, entry: RecordEntry) {
    fs.appendFileSync(
      path.join(this.dir, `${callRef}.jsonl`),
      JSON.stringify(entry) + "\n"
    );
  }

  close(_callRef: string) {}
}

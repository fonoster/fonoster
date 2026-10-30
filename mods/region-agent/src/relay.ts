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
import {
  decodeVcon,
  RecordStore,
  referencedParts,
  SignedVcon
} from "@fonoster/callrecord";
import { RelayChunk, RelayErrorReply, RelayRequest } from "./types";

// The relay responder (contract 3 `region.R.relay`, PR-5): the control plane asks for a record or
// one of its parts; the cell reads its own object storage and answers with chunks on the reply
// inbox. Each read is appended to the cell's audit log (who, what, how many bytes).

/** Raw bytes per chunk: base64 makes it ≤ 512 KB on the wire with the envelope (RC-B10). */
export const CHUNK_BYTES = 380 * 1024;

export type RelayAuditEntry = {
  at: string;
  id: string;
  userRef: string;
  workspaceRef?: string;
  op: string;
  callRef: string;
  part?: string;
  bytes: number;
  result: "ok" | string;
};

export type Content = { contentType: string; data: Buffer };

export class RelayError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

/** Byte range `{start, end}` (end inclusive, like HTTP) or `bytes=a-b`. */
export function parseRange(
  range: RelayRequest["range"],
  size: number
): { start: number; end: number } | undefined {
  if (range === undefined || range === null) return undefined;
  let start: number | undefined;
  let end: number | undefined;
  if (typeof range === "string") {
    const m = /^(?:bytes=)?(\d*)-(\d*)$/.exec(range.trim());
    if (!m) throw new RelayError("bad_range");
    if (m[1] === "" && m[2] !== "") {
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    } else {
      start = Number(m[1] || 0);
      end = m[2] === "" ? size - 1 : Number(m[2]);
    }
  } else {
    start = range.start ?? 0;
    end = range.end ?? size - 1;
  }
  end = Math.min(end, size - 1);
  if (!(start >= 0) || start > end) throw new RelayError("bad_range");
  return { start, end };
}

export class RelayResponder {
  constructor(
    private readonly store: (callRef: string) => RecordStore | undefined,
    private readonly auditFile?: string
  ) {}

  private audit(entry: RelayAuditEntry) {
    if (!this.auditFile) return;
    fs.mkdirSync(path.dirname(this.auditFile), { recursive: true });
    fs.appendFileSync(this.auditFile, JSON.stringify(entry) + "\n", {
      mode: 0o600
    });
  }

  /** The content a request asks for. */
  async read(req: RelayRequest): Promise<Content> {
    if (!req.callRef) throw new RelayError("bad_request");
    const store = this.store(req.callRef);
    if (!store) throw new RelayError("store_unavailable");
    const stored = await store.getVersion(req.callRef, req.version);
    if (!stored) throw new RelayError("not_found");
    // A region serves several workspaces (PR-14): only the caller's workspace's records.
    const any = stored.signed ?? stored.redacted;
    const owner = any
      ? ((decodeVcon(any).fonoster ?? {}) as { workspaceRef?: string })
          .workspaceRef
      : undefined;
    if (req.workspaceRef !== undefined && owner !== req.workspaceRef)
      throw new RelayError("not_found");
    const copy: SignedVcon | undefined = req.original
      ? stored.signed
      : stored.redacted;
    if (!copy) throw new RelayError("contents_deleted");
    const vcon = decodeVcon(copy);
    if (req.op === "record.get") {
      const body = {
        callRef: req.callRef,
        version: stored.version,
        redacted: !req.original,
        vcon,
        jws: copy,
        parts: stored.manifest.parts
      };
      return {
        contentType: "application/json",
        data: Buffer.from(JSON.stringify(body))
      };
    }
    if (req.op === "record.part") {
      const want = String(req.part ?? "");
      const { byRole, names } = referencedParts(vcon);
      // Only parts the chosen copy references: the redacted copy withholds what it redacted.
      const name = byRole.get(want) ?? (names.has(want) ? want : undefined);
      if (!name) {
        if (!want) throw new RelayError("bad_request");
        // In the original but withheld from the redacted copy: the caller needs unredacted access.
        const inOriginal =
          !req.original && stored.signed
            ? referencedParts(decodeVcon(stored.signed))
            : undefined;
        throw new RelayError(
          inOriginal &&
            (inOriginal.byRole.has(want) || inOriginal.names.has(want))
            ? "permission_denied"
            : "not_found"
        );
      }
      const data = await store.getPart(req.callRef, name);
      if (!data) throw new RelayError("not_found");
      const mimetype =
        stored.manifest.parts.find((p) => p.name === name)?.mimetype ??
        "application/octet-stream";
      return { contentType: mimetype, data };
    }
    throw new RelayError("unknown_op");
  }

  /** The replies for a request: chunks, or one `region.relay.error` (RG-B4). */
  async respond(req: RelayRequest): Promise<(RelayChunk | RelayErrorReply)[]> {
    const base = {
      at: new Date().toISOString(),
      id: String(req.id ?? ""),
      userRef: String(req.userRef ?? ""),
      workspaceRef: req.workspaceRef,
      op: String(req.op ?? ""),
      callRef: String(req.callRef ?? ""),
      part: req.part
    };
    try {
      const content = await this.read(req);
      const range = parseRange(req.range, content.data.length);
      const data = range
        ? content.data.subarray(range.start, range.end + 1)
        : content.data;
      const chunks: RelayChunk[] = [];
      for (let seq = 0, off = 0; off < data.length || seq === 0; seq++) {
        const slice = data.subarray(off, off + CHUNK_BYTES);
        off += CHUNK_BYTES;
        chunks.push({
          type: "region.relay.chunk",
          id: base.id,
          seq,
          last: off >= data.length,
          contentType: content.contentType,
          data: slice.toString("base64"),
          size: data.length
        });
      }
      this.audit({ ...base, bytes: data.length, result: "ok" });
      return chunks;
    } catch (e) {
      const code = e instanceof RelayError ? e.code : "internal";
      this.audit({ ...base, bytes: 0, result: code });
      return [{ type: "region.relay.error", id: base.id, code }];
    }
  }
}

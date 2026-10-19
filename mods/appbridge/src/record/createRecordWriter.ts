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
import * as path from "path";
import {
  CallRecordWriter,
  FsWorkingStore,
  openObjectStore,
  RecordIndexEntry,
  RecordStore
} from "@fonoster/callrecord";
import { AppBridgeConfig } from "../config";
import { keyCustody } from "./keyCustody";

/**
 * The call-record writer from AppBridge's `callRecord` config: working records on local disk,
 * sealed records in the region store (S3-compatible, or `<dir>/sealed` for development), and a
 * workspace's own bucket when it configured one.
 */
export function createRecordWriter(
  c: NonNullable<AppBridgeConfig["callRecord"]>,
  onSealed?: (entry: RecordIndexEntry) => void
): CallRecordWriter {
  const store = new RecordStore(
    openObjectStore(c.store ?? { dir: path.join(c.dir, "sealed") })
  );
  const workspaceStores = new Map<string, RecordStore>();
  for (const [ref, w] of Object.entries(c.workspaces ?? {}))
    if (w.store)
      workspaceStores.set(ref, new RecordStore(openObjectStore(w.store)));
  return new CallRecordWriter({
    working: new FsWorkingStore(c.dir),
    store,
    workspaceStore: (ref) => workspaceStores.get(ref),
    region: c.region,
    key: keyCustody(c),
    onSealed
  });
}

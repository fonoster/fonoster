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
import {
  ObjectStoreConfig,
  openObjectStore,
  RecordStore
} from "@fonoster/callrecord";

/**
 * Opens the store an index entry points at (its `location`). The control plane reads records
 * through the region's store (or a workspace bucket) configured here; it never copies them.
 */
export function createStoreResolver(stores: ObjectStoreConfig[]) {
  const opened = stores.map((c) => new RecordStore(openObjectStore(c)));
  return (location: string): RecordStore | undefined =>
    opened.find((s) => s.location === location);
}

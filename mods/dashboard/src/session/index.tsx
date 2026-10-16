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
import { Route, Routes } from "react-router-dom";
import { StreamsList } from "./streams";
import { CallRecordView, CallRecordsList } from "./calls";

// The session-protocol pages (streams, call records, webhooks, vendor keys), backed by the SDK
// adapter (./sdk-api.ts). Tests and stories wrap them in SessionApiProvider with the mock.

/** /w/:workspaceRef/streams; /streams/:ref opens the drawer ("new" adds a stream). */
export function StreamsScreen() {
  return (
    <Routes>
      <Route path=":ref?" element={<StreamsList />} />
    </Routes>
  );
}

/** /w/:workspaceRef/calls */
export function CallsScreen() {
  return (
    <Routes>
      <Route index element={<CallRecordsList />} />
      <Route path=":callRef" element={<CallRecordView />} />
    </Routes>
  );
}

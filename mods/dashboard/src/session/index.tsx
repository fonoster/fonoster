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
import { AppEditor, AppsList } from "./apps";
import { CallRecordView, CallRecordsList } from "./calls";

// The session-protocol pages (apps, call records, webhooks, vendor keys), backed by the SDK
// adapter (./sdk-api.ts). Tests and stories wrap them in SessionApiProvider with the mock.

/** /w/:workspaceRef/apps */
export function AppsScreen() {
  return (
    <Routes>
      <Route index element={<AppsList />} />
      <Route path=":ref" element={<AppEditor />} />
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

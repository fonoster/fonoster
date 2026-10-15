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
import { Link, Route, Routes } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { SessionAppEditor, SessionAppsList } from "./apps";
import { CallRecordView, CallRecordsList } from "./calls";

/**
 * Preview of the session-protocol app model and call records. Not linked from the navigation;
 * open it at /w/<workspace>/preview. It runs on an in-memory mock until the platform API exists
 * (see ./types.ts for the SessionApi it expects).
 */
export default function SessionPreviewScreen() {
  return (
    <div className="flex flex-col">
      <Alert variant="note" className="m-6 mb-0">
        Preview with mock data. Nothing here is saved to your workspace.
      </Alert>
      <nav className="flex gap-4 px-6 pt-4 text-sm">
        <Link to="apps">Apps</Link>
        <Link to="calls">Call records</Link>
      </nav>
      <Routes>
        <Route index element={<SessionAppsList />} />
        <Route path="apps" element={<SessionAppsList />} />
        <Route path="apps/:ref" element={<SessionAppEditor />} />
        <Route path="calls" element={<CallRecordsList />} />
        <Route path="calls/:callRef" element={<CallRecordView />} />
      </Routes>
    </div>
  );
}

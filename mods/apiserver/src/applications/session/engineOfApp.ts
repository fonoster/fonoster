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
import { AppsDb } from "./appModel";

/**
 * The voice engine for an app's numbers (sipnet createNumberRouting `engineOf`, CP-B7): session
 * apps (rows with a `url`) go to the media nodes; anything else falls through to the routing
 * config. Per-number pins still win.
 */
export function createEngineOfApp(db: AppsDb) {
  return async (appRef: string): Promise<"rebuild" | undefined> => {
    if (!appRef) return undefined;
    const app = await db.application.findUnique({
      where: { ref: appRef },
      select: { url: true }
    });
    return app?.url ? "rebuild" : undefined;
  };
}

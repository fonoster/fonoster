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

import type { Route } from "./+types/profile.page";

export function meta(_: Route.MetaArgs) {
  return [{ title: "Profile | Fonoster" }];
}

export default function Profile() {
  return (
    <div className="flex-1 flex flex-col items-center gap-16 min-h-0">
      <h1>Fonoster Profile</h1>
    </div>
  );
}

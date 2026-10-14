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
import { LogoMark } from "~/components/brand/logo";

export function Splash({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center gap-4 bg-background"
      role="status"
    >
      <LogoMark className="h-5 w-12 animate-pulse" />
      <span className="sr-only">{label}</span>
      <p aria-hidden className="text-xs text-text-muted">
        {label}
      </p>
    </div>
  );
}

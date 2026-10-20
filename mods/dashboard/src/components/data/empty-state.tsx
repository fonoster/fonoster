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
import type { ComponentType, ReactNode } from "react";

/** What a list shows before it has anything in it. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  footer
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description: ReactNode;
  action?: ReactNode;
  /** A line under the actions, such as the CLI command that does the same. */
  footer?: ReactNode;
}) {
  // The card fills the page below the header, its content centered, as in the designs.
  return (
    <div className="flex min-h-[min(780px,70vh)] flex-col items-center justify-center gap-3 rounded-xl border border-border px-6 py-14 text-center">
      <span className="mb-3 flex size-14 items-center justify-center rounded-xl border border-border bg-card">
        <Icon className="size-6 text-foreground" aria-hidden />
      </span>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-[13px] text-muted-foreground">
        {description}
      </p>
      {action && (
        <div className="flex flex-wrap justify-center gap-2 pt-2">{action}</div>
      )}
      {footer}
    </div>
  );
}

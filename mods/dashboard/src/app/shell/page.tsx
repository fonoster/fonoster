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
import { Construction } from "lucide-react";
import type { ReactNode } from "react";

/** Title, description and actions at the top of a page. */
export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 px-4 pb-5 pt-7 sm:px-8">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-[22px] font-semibold leading-tight">{title}</h1>
        {description && (
          <p className="font-display text-[13px] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

/** A screen of the shell that isn't rebuilt yet on this branch. */
export function PendingScreen({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="mx-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center sm:mx-8 mb-8">
        <Construction className="size-6 text-muted-foreground" aria-hidden />
        <p className="font-display text-[13px] text-muted-foreground">
          This screen is being rebuilt.
        </p>
      </div>
    </>
  );
}

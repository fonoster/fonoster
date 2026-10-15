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
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { UserBar } from "~/workspaces/user-bar";

/** The start-screen frame (no workspace sidebar) for region pages. */
export function StartLayout({
  title,
  actions,
  children
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className="flex flex-1 justify-center px-4 pb-20 pt-10">
        <div className="flex w-full max-w-[560px] flex-col gap-6">
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-1.5 self-start font-display text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Workspaces
          </Link>
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[26px] font-semibold">{title}</h1>
            {actions}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

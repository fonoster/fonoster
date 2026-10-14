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
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { STORAGE_KEYS, storage } from "~/lib/storage";
import { useMediaQuery } from "~/lib/use-media-query";
import { useWorkspace } from "~/lib/workspace";
import { DOCS_URL, SUPPORT_URL } from "./nav";
import { Sidebar } from "./sidebar";

/** The signed-in frame: sidebar (240px, or a 64px rail) and a top bar over the page. */
export function AppShell() {
  const workspace = useWorkspace();
  const wide = useMediaQuery("(min-width: 768px)");
  const [collapsedByUser, setCollapsed] = useState(
    () => storage.get(STORAGE_KEYS.nav) === "collapsed"
  );
  const collapsed = collapsedByUser || !wide;

  const toggle = () => {
    const next = !collapsedByUser;
    storage.set(STORAGE_KEYS.nav, next ? "collapsed" : "expanded");
    setCollapsed(next);
  };

  return (
    <div className="flex min-h-full bg-background">
      <Sidebar
        workspace={workspace}
        collapsed={collapsed}
        canExpand={wide}
        onToggle={toggle}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-border px-4 font-display text-[13px] text-muted-foreground sm:px-8">
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Docs
          </a>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground"
          >
            Support
          </a>
        </header>
        <main className="flex min-w-0 flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

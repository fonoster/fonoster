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
import type { Workspace } from "@fonoster/types";
import { Link, useOutletContext } from "react-router-dom";
import { Logo } from "~/components/brand/logo";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/lib/auth";

/** Stand-in until the app shell lands (tasks section 3). */
export function WorkspaceHome() {
  const workspace = useOutletContext<Workspace>();
  const { signOut } = useAuth();
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <Logo />
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <p className="max-w-md text-sm text-text-secondary">
        You're in. The workspace screens arrive with the app shell.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" asChild>
          <Link to="/workspaces">Switch workspace</Link>
        </Button>
        <Button variant="ghost" onClick={() => signOut()}>
          Sign out
        </Button>
      </div>
    </main>
  );
}

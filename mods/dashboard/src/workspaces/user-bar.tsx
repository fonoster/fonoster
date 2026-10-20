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
import { ArrowLeft, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "~/components/brand/logo";
import { Avatar, AvatarFallback, initials } from "~/components/ui/avatar";
import { useAuth } from "~/lib/auth";
import { useCurrentUser } from "./workspaces.service";

/**
 * Top bar of the screens outside a workspace. `back` adds a way back to the workspace the user
 * came from (Billing).
 */
export function UserBar({
  back
}: { back?: { to: string; label: string } } = {}) {
  const { user, signOut } = useAuth();
  const { data: profile } = useCurrentUser();
  const name = profile?.name || user?.email || "";

  return (
    <header className="flex items-center justify-between px-6 py-5 sm:px-10">
      <div className="flex items-center gap-6">
        <Logo />
        {back && (
          <Link
            to={back.to}
            className="inline-flex items-center gap-1.5 font-display text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-[15px]" aria-hidden /> {back.label}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3 font-display">
        <Avatar>
          <AvatarFallback className="bg-muted text-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden flex-col sm:flex">
          <span className="text-[13px] font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{user?.email}</span>
        </div>
        <span className="h-6 w-px bg-border" aria-hidden />
        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] hover:underline"
        >
          <LogOut className="size-[15px]" aria-hidden /> Sign out
        </button>
      </div>
    </header>
  );
}

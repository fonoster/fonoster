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
import { useEffect, useState } from "react";
import { CopyField } from "~/components/data/copy-field";
import { Button } from "~/components/ui/button";
import { composeCommand, helmCommand } from "./install";
import { remaining } from "./status";
import type { RegionToken } from "./types";

/** Re-renders every `ms` so countdowns move. */
function useNow(ms = 30_000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [ms]);
  return now;
}

/**
 * The install command with its token: Compose or Helm, a small expiry line and, when the token
 * is missing or expired, a Re-issue link.
 */
export function InstallCommand({
  enrollment,
  onReissue,
  busy
}: {
  enrollment?: RegionToken;
  onReissue: () => void;
  busy?: boolean;
}) {
  const [tab, setTab] = useState<"compose" | "helm">("compose");
  const now = useNow();
  const left = enrollment ? remaining(enrollment.expiresAt, now) : undefined;
  const reissue = (
    <Button
      variant="link"
      size="sm"
      className="h-auto p-0 text-xs"
      loading={busy}
      onClick={onReissue}
    >
      Re-issue token
    </Button>
  );
  if (!enrollment || !left)
    return (
      <p className="flex items-center gap-2 font-display text-xs text-muted-foreground">
        {enrollment ? "This token has expired." : "Get the install command."}{" "}
        {reissue}
      </p>
    );
  return (
    <section aria-label="Install" className="flex flex-col gap-2">
      <div role="tablist" className="flex gap-1.5">
        {(["compose", "helm"] as const).map((t) => (
          <Button
            key={t}
            role="tab"
            size="sm"
            aria-selected={tab === t}
            variant={tab === t ? "default" : "outline"}
            onClick={() => setTab(t)}
          >
            {t === "compose" ? "Compose" : "Helm"}
          </Button>
        ))}
      </div>
      <CopyField
        label={tab === "compose" ? "Docker Compose" : "Helm"}
        value={
          tab === "compose"
            ? composeCommand(enrollment.token)
            : helmCommand(enrollment.token)
        }
      />
      <p className="font-display text-xs text-muted-foreground">
        Expires in {left}.
      </p>
    </section>
  );
}

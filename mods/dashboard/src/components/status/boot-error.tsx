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
import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "~/components/brand/logo";
import { Button } from "~/components/ui/button";

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-full items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-6 text-center">
        <Logo />
        <h1 className="text-2xl font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

/** The image started without a usable DASHBOARD_API_URL. */
export function ConfigError({ error }: { error: string }) {
  return (
    <Frame title="The dashboard isn't configured">
      <p className="text-sm text-text-secondary">{error}.</p>
      <p className="text-sm text-text-secondary">
        Set{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">
          DASHBOARD_API_URL
        </code>{" "}
        on the dashboard container to your API's address and restart it.
      </p>
    </Frame>
  );
}

/** GetCapabilities failed, so the dashboard can't know how to sign people in. */
export function ApiUnreachable({
  apiUrl,
  onRetry
}: {
  apiUrl: string;
  onRetry: () => void;
}) {
  return (
    <Frame title="Can't reach the Fonoster API">
      <p className="text-sm text-text-secondary">
        The dashboard couldn't connect to{" "}
        <code className="break-all text-foreground">{apiUrl}</code>. Check that
        the API is running and that DASHBOARD_API_URL points to it.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw aria-hidden /> Try again
      </Button>
    </Frame>
  );
}

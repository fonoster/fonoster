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
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { ApiUnreachable } from "~/components/status/boot-error";
import { Splash } from "~/components/status/splash";
import { Toaster } from "~/components/ui/sonner";
import { TooltipProvider } from "~/components/ui/tooltip";
import { AuthProvider } from "~/lib/auth";
import { CapabilitiesProvider } from "~/lib/capabilities";
import type { WebClient } from "~/lib/client";
import { RuntimeProvider } from "~/lib/runtime-context";

export function App({
  apiUrl,
  client,
  queryClient,
  children
}: {
  apiUrl: string;
  client: WebClient;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <RuntimeProvider value={{ apiUrl }}>
      <QueryClientProvider client={queryClient}>
        <CapabilitiesProvider
          client={client}
          loading={<Splash />}
          failed={(retry) => <ApiUnreachable apiUrl={apiUrl} onRetry={retry} />}
        >
          <BrowserRouter>
            <AuthProvider client={client}>
              <TooltipProvider delayDuration={300}>
                {children}
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </BrowserRouter>
        </CapabilitiesProvider>
      </QueryClientProvider>
    </RuntimeProvider>
  );
}

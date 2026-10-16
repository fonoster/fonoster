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
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import type { AuthMethod, Capabilities, WebClient } from "./client";

const CapabilitiesContext = createContext<Capabilities | null>(null);

type State =
  | { status: "loading" }
  | { status: "ready"; capabilities: Capabilities }
  | { status: "error"; error: unknown };

/**
 * Asks the API what this deployment supports before anything renders. There
 * is no fallback: a guess could offer sign-in methods the server refuses.
 */
export function CapabilitiesProvider({
  client,
  loading,
  failed,
  children
}: {
  client: Pick<WebClient, "getCapabilities">;
  loading: ReactNode;
  failed: (retry: () => void, error: unknown) => ReactNode;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(() => {
    setState({ status: "loading" });
    client
      .getCapabilities()
      .then((capabilities) => setState({ status: "ready", capabilities }))
      .catch((error: unknown) => setState({ status: "error", error }));
  }, [client]);

  useEffect(load, [load]);

  if (state.status === "loading") return <>{loading}</>;
  if (state.status === "error") return <>{failed(load, state.error)}</>;

  return (
    <CapabilitiesContext.Provider value={state.capabilities}>
      {children}
    </CapabilitiesContext.Provider>
  );
}

/** Lets stories and tests render screens with a fixed set of capabilities. */
export const CapabilitiesOverride = CapabilitiesContext.Provider;

export function useCapabilities(): Capabilities {
  const capabilities = useContext(CapabilitiesContext);
  if (!capabilities)
    throw new Error("useCapabilities must be used inside CapabilitiesProvider");
  return capabilities;
}

/**
 * Private regions are an optional integration: on only when the apiserver
 * reports `regions.private` (hub and signing key configured). The public
 * region `default` always exists and never shows region UI on its own.
 * Outside a provider (isolated stories) it is off.
 */
export function usePrivateRegions(): boolean {
  return useContext(CapabilitiesContext)?.regions?.private ?? false;
}

export function useAuthMethods() {
  const { auth } = useCapabilities();
  const has = (method: AuthMethod) => auth.methods.includes(method);
  return {
    password: has("password"),
    emailCode: has("email_code"),
    github: has("github") && Boolean(auth.github),
    openSignup: auth.signup === "open",
    githubConfig: auth.github
  };
}

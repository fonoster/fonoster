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
import { createContext, useContext, useEffect, useState } from "react";
import { createMockSessionApi } from "./mock-api";
import type { SessionApi } from "./types";

const SessionApiContext = createContext<SessionApi | undefined>(undefined);
export const SessionApiProvider = SessionApiContext.Provider;

let fallback: SessionApi | undefined;

/** The provided adapter, or the in-memory mock when none is provided. */
export function useSessionApi(): SessionApi {
  const provided = useContext(SessionApiContext);
  if (provided) return provided;
  fallback ??= createMockSessionApi();
  return fallback;
}

export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({
    loading: true
  });
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    load().then(
      (data) => live && setState({ data, loading: false }),
      (e: unknown) => live && setState({ error: String(e), loading: false })
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

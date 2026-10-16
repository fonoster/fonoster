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
  useMemo,
  useState
} from "react";
import { useParams } from "react-router-dom";
import { useSdk } from "~/lib/auth";
import { createSdkSessionApi } from "./sdk-api";
import type { SessionApi } from "./types";

const SessionApiContext = createContext<SessionApi | undefined>(undefined);
/** Overrides the SDK adapter (tests and stories pass the in-memory mock). */
export const SessionApiProvider = SessionApiContext.Provider;

/** The provided adapter, or the SDK adapter for the current workspace. */
export function useSessionApi(): SessionApi {
  const provided = useContext(SessionApiContext);
  const sdk = useSdk();
  // A new adapter per workspace, so pages reload when the workspace changes.
  const { workspaceRef } = useParams();
  return useMemo(
    () => provided ?? createSdkSessionApi(sdk),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provided, sdk, workspaceRef]
  );
}

/** The message of an API error (gRPC-Web errors carry it in `message`). */
export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Loads data for a page; `reload()` runs the loader again. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({
    loading: true
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    load().then(
      (data) => live && setState({ data, loading: false }),
      (e: unknown) =>
        live && setState({ error: errorMessage(e), loading: false })
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

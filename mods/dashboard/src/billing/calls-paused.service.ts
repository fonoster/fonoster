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
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useSdk } from "~/lib/auth";
import { useCapabilities } from "~/lib/capabilities";
import { useMaybeWorkspace } from "~/lib/workspace";

export type CallsPaused = { paused: boolean; reason?: string };

const NOT_PAUSED: CallsPaused = { paused: false };

/** While calls are paused, read again this often, so fixing billing elsewhere shows here. */
const PAUSED_POLL_MS = 60_000;

export const callsStatusKey = (accessKeyId: string) => [
  "calls-status",
  accessKeyId
];

/**
 * Whether billing paused calls in the current workspace (GetCallsStatus, for anyone in it). Only
 * the current workspace: the shared client already carries its access key, which this never
 * moves. A read that fails counts as not paused, so it never disables calls. Billing off (no
 * `billing.enabled`): no request, never paused.
 */
export function useCallsPaused() {
  const sdk = useSdk();
  const workspace = useMaybeWorkspace();
  const { billing } = useCapabilities();
  const enabled = billing.enabled && Boolean(workspace);
  const query = useQuery({
    queryKey: callsStatusKey(workspace?.accessKeyId ?? ""),
    enabled,
    refetchOnWindowFocus: "always",
    refetchInterval: (q) => (q.state.data?.paused ? PAUSED_POLL_MS : false),
    queryFn: async (): Promise<CallsPaused> => {
      try {
        const { paused, reason } = await sdk.billing.getCallsStatus();
        return { paused, reason };
      } catch {
        return NOT_PAUSED;
      }
    }
  });
  const { refetch } = query;
  /** Reads the state again now (after a refusal); the bar and buttons follow. */
  const refresh = useCallback(async (): Promise<CallsPaused> => {
    if (!enabled) return NOT_PAUSED;
    return (await refetch()).data ?? NOT_PAUSED;
  }, [enabled, refetch]);
  const data = enabled ? query.data : undefined;
  return {
    paused: Boolean(data?.paused),
    reason: data?.reason,
    refresh
  };
}

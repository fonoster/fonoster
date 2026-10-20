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
import type { CallDetailRecord } from "@fonoster/types";
import { useQuery } from "@tanstack/react-query";
import { useSdk } from "~/lib/auth";
import { PAGE_SIZE } from "~/lib/resource";
import { useWorkspace } from "~/lib/workspace";
import { rangeAfter, type Range } from "./stats";

/** Overview reads at most this many calls per range; past it, totals show "+". */
export const MAX_CALLS = 1000;

/**
 * Every call in the range, newest first, up to MAX_CALLS. There's no stats
 * API yet, so the Overview aggregates the call records in the browser.
 */
export function useRangeCalls(range: Range) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["calls", workspace.ref, "overview", range],
    queryFn: async () => {
      const after = rangeAfter(range).toISOString();
      const items: CallDetailRecord[] = [];
      let pageToken: string | undefined;
      let capped = false;
      for (;;) {
        const page = await sdk.calls.listCalls({
          after,
          pageSize: PAGE_SIZE,
          pageToken
        });
        items.push(...page.items);
        // A short page is the last one, whatever token comes with it.
        if (page.items.length < PAGE_SIZE || !page.nextPageToken) break;
        if (items.length >= MAX_CALLS) {
          capped = true;
          break;
        }
        pageToken = page.nextPageToken;
      }
      return { items: items.slice(0, MAX_CALLS), capped };
    }
  });
}

export type Setup = {
  /** Any agent or app. */
  hasApp: boolean;
  /** The first Autopilot agent, which "Talk to agent" opens. */
  agentRef?: string;
  hasTrunk: boolean;
  /** A number that sends its calls somewhere (an app or a SIP agent). */
  hasRoutedNumber: boolean;
};

/**
 * What a new workspace has set up, for the Overview's first-call checklist. A
 * list that fails to load counts as not set up, so the step stays offered.
 */
export function useSetup() {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery<Setup>({
    queryKey: ["overview", workspace.ref, "setup"],
    queryFn: async () => {
      const load = async <T>(list: () => Promise<{ items: T[] }>) => {
        try {
          return (await list()).items;
        } catch {
          return [] as T[];
        }
      };
      const [apps, trunks, numbers] = await Promise.all([
        load(() => sdk.applications.listApplications({ pageSize: PAGE_SIZE })),
        load(() => sdk.trunks.listTrunks({ pageSize: 1 })),
        load(() => sdk.numbers.listNumbers({ pageSize: PAGE_SIZE }))
      ]);
      return {
        hasApp: apps.length > 0,
        agentRef: apps.find((a) => a.type === "AUTOPILOT")?.ref,
        hasTrunk: trunks.length > 0,
        hasRoutedNumber: numbers.some((n) => Boolean(n.appRef || n.agentAor))
      };
    }
  });
}

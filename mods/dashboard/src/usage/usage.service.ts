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
import { useSdk } from "~/lib/auth";
import { useWorkspace } from "~/lib/workspace";

/** The workspace's usage for a range of days, grouped for the Usage page. */
export function useUsage(fromDay: string, toDay: string) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  return useQuery({
    queryKey: ["usage", workspace.ref, fromDay, toDay],
    queryFn: async () =>
      (
        await sdk.usage.getUsage({
          fromDay,
          toDay,
          groupBy: ["key_source", "origin", "provider", "model"]
        })
      ).rows
  });
}

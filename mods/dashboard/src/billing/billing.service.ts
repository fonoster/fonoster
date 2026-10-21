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
import type { BillingSummary, Workspace } from "@fonoster/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "~/components/ui/sonner";
import { useAuth, useSdk } from "~/lib/auth";
import { useCapabilities } from "~/lib/capabilities";
import { useWorkspaces } from "~/workspaces/workspaces.service";

export const BILLING_KEY = ["billing"];

/** The workspaces the signed-in user owns: billing is theirs (add-billing-page D2). */
export function useOwnedWorkspaces(): Workspace[] | undefined {
  const { user } = useAuth();
  const { data: workspaces } = useWorkspaces();
  return workspaces?.filter(
    (w) => Boolean(user?.sub) && w.ownerRef === user?.sub
  );
}

/** Whether this user sees billing at all: Fonoster Cloud, and they own a workspace (D0, D2). */
export function useBillingAvailable(): boolean | undefined {
  const { billing } = useCapabilities();
  const owned = useOwnedWorkspaces();
  if (!billing.enabled) return false;
  return owned === undefined ? undefined : owned.length > 0;
}

/**
 * The owner's account. The Billing API checks ownership per workspace, so requests go out with
 * one the user owns (`workspace`); the account is the same whichever (D2).
 */
export function useBilling(workspace?: Workspace, poll = false) {
  const sdk = useSdk();
  const { client } = useAuth();
  return useQuery({
    queryKey: BILLING_KEY,
    enabled: Boolean(workspace),
    refetchInterval: poll ? 2000 : false,
    queryFn: async (): Promise<BillingSummary> => {
      client.setAccessKeyId(workspace!.accessKeyId);
      return sdk.billing.getBilling();
    }
  });
}

function useBillingMutation<T>(
  workspace: Workspace | undefined,
  run: (sdk: ReturnType<typeof useSdk>, input: T) => Promise<unknown>,
  success?: string
) {
  const sdk = useSdk();
  const { client } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) => {
      client.setAccessKeyId(workspace!.accessKeyId);
      return run(sdk, input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: BILLING_KEY });
      if (success) toast.success(success);
    }
  });
}

export const useTopUp = (workspace?: Workspace) =>
  useBillingMutation<number>(workspace, (sdk, credits) =>
    sdk.billing.createTopUp({ credits })
  );

export const useUpdateAutoRecharge = (workspace?: Workspace) =>
  useBillingMutation<{ enabled: boolean; threshold: number; amount: number }>(
    workspace,
    (sdk, request) => sdk.billing.updateAutoRecharge(request),
    "Auto-recharge saved"
  );

/** The API's answer when paying needs a card first (Customer Portal). */
export const needsPaymentMethod = (error: unknown) =>
  /payment method/i.test(String((error as Error)?.message ?? ""));

export const useSubscribe = (workspace?: Workspace) =>
  useBillingMutation<void>(workspace, (sdk) => sdk.billing.subscribe());

/** Opens the Stripe Customer Portal in this tab; it sends the owner back here (D5). */
export function useOpenPortal(workspace?: Workspace) {
  const sdk = useSdk();
  const { client } = useAuth();
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      client.setAccessKeyId(workspace!.accessKeyId);
      const { url } = await sdk.billing.createPortalSession({
        returnUrl: returnUrl ?? window.location.href
      });
      window.location.assign(url);
    }
  });
}

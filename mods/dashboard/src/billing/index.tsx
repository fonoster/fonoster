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
import { ExternalLink, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Switch } from "~/components/ui/switch";
import { errorMessage } from "~/lib/errors";
import { UserBar } from "~/workspaces/user-bar";
import { workspacePath } from "~/workspaces/workspace-session";
import { useWorkspaces } from "~/workspaces/workspaces.service";
import { AutoRechargeDialog } from "./auto-recharge-dialog";
import {
  needsPaymentMethod,
  useBilling,
  useBillingAvailable,
  useOpenPortal,
  useOwnedWorkspaces,
  useSubscribe
} from "./billing.service";
import { credits, dollars, longDate } from "./format";
import { TopUpDialog } from "./top-up-dialog";

/** How long the page waits for a top-up's credits before it stops checking (D7). */
const POLL_MS = 30_000;
/** The credits the Pay-as-you-go plan adds each period (planLine says the same). */
const PLAN_CREDITS = 2_500;

/**
 * Billing (add-billing-page): the owner's credits, on a page of its own outside the workspaces,
 * reached from the account menu. Fonoster Cloud only, and only for users who own a workspace.
 */
export default function BillingPage() {
  const available = useBillingAvailable();
  const owned = useOwnedWorkspaces();
  const { data: workspaces } = useWorkspaces();
  const [params] = useSearchParams();
  if (available === false) return <Navigate to="/workspaces" replace />;

  // Requests go out with a workspace the user owns: the one they came from (the account menu
  // passes it), else the first. Nothing is remembered between visits (land-on-workspaces-list).
  const from = params.get("from");
  const workspace = owned?.find((w) => w.ref === from) ?? owned?.[0];
  // "Back to" names where they came from, owned or not.
  const back = workspaces?.find((w) => w.ref === from) ?? workspace;

  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar
        back={
          back
            ? { to: workspacePath(back.ref), label: `Back to ${back.name}` }
            : undefined
        }
      />
      <main className="flex flex-1 justify-center bg-[url(/pattern-center.png)] bg-cover bg-center px-4 pb-20 pt-10 sm:pt-14">
        <div className="flex w-full max-w-[960px] flex-col gap-5">
          {workspace ? <Billing workspace={workspace} /> : <Loading />}
        </div>
      </main>
    </div>
  );
}

function Loading() {
  return (
    <>
      <Skeleton className="h-16 w-80" />
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </>
  );
}

function Billing({ workspace }: { workspace: Workspace }) {
  const [pollUntil, setPollUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const polling = pollUntil > now;
  const billing = useBilling(workspace, polling);
  const portal = useOpenPortal(workspace);
  const subscribe = useSubscribe(workspace);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [waitingFor, setWaitingFor] = useState(0);
  const [params, setParams] = useSearchParams();
  const [balanceBefore, setBalanceBefore] = useState<number>();

  // Stop polling after POLL_MS, or as soon as the credits arrived.
  useEffect(() => {
    if (!polling) return;
    const t = setTimeout(() => setNow(Date.now()), 1000);
    return () => clearTimeout(t);
  }, [polling, now]);
  const s = billing.data;
  // Paid credits arrive when Stripe confirms the payment: poll until the balance has them.
  const awaitCredits = (amount: number, before: number) => {
    setBalanceBefore(before);
    setWaitingFor(amount);
    setNow(Date.now());
    setPollUntil(Date.now() + POLL_MS);
  };
  // Back from the portal with a card: finish the upgrade the owner asked for, once.
  const resumeUpgrade = params.get("upgrade") === "1" && s?.plan === "trial";
  const resumed = useRef(false);
  const { mutate: startSubscription } = subscribe;
  const balanceNow = s?.balance ?? 0;
  useEffect(() => {
    // The mutation object changes every render; the ref keeps this to one call.
    if (!resumeUpgrade || resumed.current) return;
    resumed.current = true;
    setParams(
      (p) => {
        p.delete("upgrade");
        return p;
      },
      { replace: true }
    );
    startSubscription(undefined, {
      onSuccess: () => {
        setBalanceBefore(balanceNow);
        setWaitingFor(PLAN_CREDITS);
        setNow(Date.now());
        setPollUntil(Date.now() + POLL_MS);
      }
    });
  }, [resumeUpgrade, setParams, startSubscription, balanceNow]);
  const arrived =
    s !== undefined &&
    balanceBefore !== undefined &&
    s.balance >= balanceBefore + waitingFor;
  useEffect(() => {
    if (arrived) setPollUntil(0);
  }, [arrived]);

  if (billing.error)
    return (
      <Alert variant="error">
        {errorMessage(billing.error)}{" "}
        <button
          type="button"
          className="cursor-pointer underline"
          onClick={() => void billing.refetch()}
        >
          Try again
        </button>
      </Alert>
    );
  if (!s) return <Loading />;

  const trial = s.plan === "trial";
  const ended = s.status === "ended";
  const pastDue = s.status === "past_due";
  const inProgress = waitingFor > 0 && !arrived;

  const upgrade = () =>
    subscribe.mutate(undefined, {
      onSuccess: () => awaitCredits(PLAN_CREDITS, s.balance),
      // No payment method yet: the portal asks for one first; upgrading finishes on return (D5).
      onError: (error) => {
        if (!needsPaymentMethod(error)) return;
        const back = new URL(window.location.href);
        back.searchParams.set("upgrade", "1");
        portal.mutate(back.toString());
      }
    });

  const primary = trial ? (
    <Button onClick={upgrade} loading={subscribe.isPending || portal.isPending}>
      Upgrade to Pay-as-you-go
    </Button>
  ) : pastDue ? (
    <Button onClick={() => portal.mutate(undefined)} loading={portal.isPending}>
      <ExternalLink aria-hidden /> Update payment method
    </Button>
  ) : (
    <Button onClick={() => setTopUpOpen(true)}>
      <Plus aria-hidden /> Top up
    </Button>
  );

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="text-[26px] font-semibold">Billing</h1>
          <p className="font-display text-sm text-muted-foreground">
            Your credits pay for calls in every workspace you own.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 md:shrink-0 md:flex-nowrap">
          {!pastDue && (
            <Button
              variant="outline"
              onClick={() => portal.mutate(undefined)}
              loading={portal.isPending && !trial}
            >
              <ExternalLink aria-hidden /> Manage payment methods and invoices
            </Button>
          )}
          {primary}
        </div>
      </div>

      {subscribe.error && !needsPaymentMethod(subscribe.error) && (
        <Alert variant="error">{errorMessage(subscribe.error)}</Alert>
      )}
      {portal.error && (
        <Alert variant="error">{errorMessage(portal.error)}</Alert>
      )}
      {ended && (
        <Alert variant="error">
          <strong className="block">Your Trial has ended</strong>
          Calls are paused in your workspaces. Upgrade to Pay-as-you-go to keep
          them running.
        </Alert>
      )}
      {pastDue && (
        <Alert variant="error">
          <strong className="block">Your last payment failed</strong>
          Update your card in the Customer Portal. Calls keep working while the
          balance lasts.
        </Alert>
      )}
      {inProgress && (
        <Alert variant="info">
          <strong className="block">Payment in progress</strong>
          {polling
            ? `${credits(waitingFor)} credits are added as soon as the payment goes through. This page updates by itself.`
            : `${credits(waitingFor)} credits are added once the payment clears.`}
        </Alert>
      )}

      <div
        className={
          trial ? "grid gap-4 md:grid-cols-2" : "grid gap-4 md:grid-cols-3"
        }
      >
        <Card label="Balance" value={`${credits(s.balance)} credits`} mono>
          {dollars(s.balance)} ·{" "}
          {trial
            ? ended
              ? "the Trial's credits expired"
              : "no overdraft on the Trial"
            : `may go ${credits(s.overdraft)} credits below zero`}
        </Card>
        <Card
          label="Plan"
          value={trial ? (ended ? "Trial ended" : "Trial") : "Pay-as-you-go"}
        >
          {planLine(s)}
        </Card>
        {!trial && (
          <Card
            label="Auto-recharge"
            value={s.autoRecharge ? "On" : "Off"}
            action={
              <Switch
                aria-label="Auto-recharge"
                checked={s.autoRecharge}
                onCheckedChange={() => setRechargeOpen(true)}
              />
            }
          >
            {s.autoRecharge
              ? `Below ${credits(s.rechargeThreshold)} credits, buy ${credits(s.rechargeAmount)} (${dollars(s.rechargeAmount)})`
              : "Buy credits when the balance runs low."}
          </Card>
        )}
      </div>

      {s.sources.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="px-5 pt-5 pb-3 font-display text-sm font-medium">
            Credits by source
          </h2>
          <table className="w-full font-display text-[13px]">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-5 pb-2.5 font-normal">Source</th>
                <th className="w-40 px-5 pb-2.5 font-normal">Credits</th>
                <th className="w-52 px-5 pb-2.5 font-normal">Expires</th>
              </tr>
            </thead>
            <tbody>
              {s.sources.map((source, i) => (
                <tr key={i} className="h-[52px] border-t border-border">
                  <td className="px-5">
                    {SOURCE_NAMES[source.kind] ?? source.kind}
                  </td>
                  <td className="px-5 font-mono">{credits(source.credits)}</td>
                  <td className="px-5 text-muted-foreground">
                    {source.expiresAt ? longDate(source.expiresAt) : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        workspace={workspace}
        onBought={(amount) => awaitCredits(amount, s.balance)}
      />
      <AutoRechargeDialog
        open={rechargeOpen}
        onOpenChange={setRechargeOpen}
        workspace={workspace}
        summary={s}
      />
    </>
  );
}

const SOURCE_NAMES: Record<string, string> = {
  plan: "Plan credits",
  topup: "Top-up credits",
  trial: "Trial credits"
};

function planLine(s: BillingSummary) {
  const trialEnd = s.sources.find((x) => x.kind === "trial")?.expiresAt;
  if (s.plan === "trial")
    return s.status === "ended"
      ? "Upgrade to keep calls running"
      : `1,000 credits to try${trialEnd ? ` · ends ${longDate(trialEnd)}` : ""}`;
  if (s.status === "past_due") return "$25 a month · payment failed";
  return `$25 a month · 2,500 credits${s.periodEnd ? ` · renews ${longDate(s.periodEnd)}` : ""}`;
}

function Card({
  label,
  value,
  mono,
  action,
  children
}: {
  label: string;
  value: string;
  mono?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={label}
      className="flex flex-col gap-3.5 rounded-xl border border-border bg-card p-5"
    >
      <span className="font-display text-xs text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center justify-between gap-3">
        <span
          className={
            mono
              ? "font-mono text-xl font-semibold"
              : "font-display text-xl font-semibold"
          }
        >
          {value}
        </span>
        {action}
      </span>
      <span className="font-display text-xs text-muted-foreground">
        {children}
      </span>
    </section>
  );
}

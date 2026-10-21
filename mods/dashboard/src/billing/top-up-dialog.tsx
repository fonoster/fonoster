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
import type { Workspace } from "@fonoster/types";
import { useState } from "react";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { useTopUp } from "./billing.service";
import { credits, dollars } from "./format";

/** The smallest top-up (add-billing-service Q5): 1,000 credits, $10. */
export const MIN_CREDITS = 1000;
const CHOICES = [1000, 2500, 5000];

/** Buys credits (D4): a few amounts or a custom one, tax added at checkout. */
export function TopUpDialog({
  open,
  onOpenChange,
  workspace,
  onBought
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  onBought: (amount: number) => void;
}) {
  const [choice, setChoice] = useState<number | "custom">(2500);
  const [custom, setCustom] = useState("");
  const topUp = useTopUp(workspace);
  const amount = choice === "custom" ? Number(custom) : choice;
  const tooSmall =
    choice === "custom" && !(Number.isInteger(amount) && amount >= MIN_CREDITS);

  const buy = () =>
    topUp.mutate(amount, {
      onSuccess: () => {
        onBought(amount);
        onOpenChange(false);
      }
    });

  const option = (value: number | "custom", label: string, sub: string) => (
    <button
      key={String(value)}
      type="button"
      role="radio"
      aria-checked={choice === value}
      aria-label={label}
      onClick={() => setChoice(value)}
      className="flex cursor-pointer items-start gap-3 rounded-control py-1.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className={cn(
          "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-foreground",
          choice === value &&
            "after:size-2 after:rounded-full after:bg-foreground"
        )}
      />
      <span className="flex flex-col gap-0.5 font-display">
        <span className="text-sm">{label}</span>
        <span className="text-[13px] text-muted-foreground">{sub}</span>
      </span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top up</DialogTitle>
          <DialogDescription>
            1 credit is $0.01. Tax is added at checkout where it applies.
          </DialogDescription>
        </DialogHeader>
        <div
          role="radiogroup"
          aria-label="Amount"
          className="flex flex-col gap-1.5"
        >
          {CHOICES.map((c) => option(c, `${credits(c)} credits`, dollars(c)))}
          {option(
            "custom",
            "Custom amount",
            `At least ${credits(MIN_CREDITS)} credits`
          )}
          {choice === "custom" && (
            <Input
              aria-label="Credits"
              inputMode="numeric"
              placeholder="1000"
              className="ml-7 w-48"
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
            />
          )}
        </div>
        <p className="font-display text-xs text-muted-foreground">
          Charged to the card in the Customer Portal. The credits appear once
          the payment goes through.
        </p>
        {topUp.error && (
          <Alert variant="error">{errorMessage(topUp.error)}</Alert>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={buy} disabled={tooSmall} loading={topUp.isPending}>
            {tooSmall ? "Buy credits" : `Buy ${credits(amount)} credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

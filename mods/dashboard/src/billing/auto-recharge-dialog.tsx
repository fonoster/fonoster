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
import { useEffect, useState } from "react";
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
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { errorMessage } from "~/lib/errors";
import { useUpdateAutoRecharge } from "./billing.service";
import { credits, dollars } from "./format";
import { MIN_CREDITS } from "./top-up-dialog";

/** Suggested when it is turned on the first time (add-billing-service Q5). */
const SUGGESTED = { threshold: 500, amount: 2500 };

/** Turns auto-recharge on or off, with when it buys and how much. */
export function AutoRechargeDialog({
  open,
  onOpenChange,
  workspace,
  summary
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: Workspace;
  summary: BillingSummary;
}) {
  const [enabled, setEnabled] = useState(true);
  const [threshold, setThreshold] = useState("");
  const [amount, setAmount] = useState("");
  const update = useUpdateAutoRecharge(workspace);

  useEffect(() => {
    if (!open) return;
    // Opened by flipping the card's switch: it proposes the opposite of what is set now.
    setEnabled(!summary.autoRecharge);
    setThreshold(String(summary.rechargeThreshold || SUGGESTED.threshold));
    setAmount(String(summary.rechargeAmount || SUGGESTED.amount));
  }, [open, summary]);

  const amountN = Number(amount);
  const thresholdN = Number(threshold);
  const amountError =
    enabled && !(Number.isInteger(amountN) && amountN >= MIN_CREDITS)
      ? `At least ${credits(MIN_CREDITS)} credits.`
      : undefined;
  const thresholdError =
    enabled && !(Number.isInteger(thresholdN) && thresholdN > 0)
      ? "More than 0 credits."
      : undefined;

  const save = () =>
    update.mutate(
      { enabled, threshold: thresholdN, amount: amountN },
      { onSuccess: () => onOpenChange(false) }
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Auto-recharge</DialogTitle>
          <DialogDescription>
            Buy credits automatically when the balance runs low.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-3">
          <Switch
            id="recharge-on"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <Label htmlFor="recharge-on">Recharge automatically</Label>
        </div>
        {enabled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="When the balance falls below" error={thresholdError}>
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(e.target.value.replace(/\D/g, ""))
                  }
                />
              )}
            </Field>
            <Field
              label="Buy"
              error={amountError}
              hint={
                amountError
                  ? undefined
                  : `${credits(amountN || 0)} credits · ${dollars(amountN || 0)}`
              }
            >
              {(p) => (
                <Input
                  {...p}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                />
              )}
            </Field>
          </div>
        )}
        <p className="font-display text-xs text-muted-foreground">
          At least {credits(MIN_CREDITS)} credits, charged to the card in the
          Customer Portal with tax on top. It turns off after three declined
          payments, and you are told.
        </p>
        {update.error && (
          <Alert variant="error">{errorMessage(update.error)}</Alert>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={save}
            disabled={Boolean(amountError || thresholdError)}
            loading={update.isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

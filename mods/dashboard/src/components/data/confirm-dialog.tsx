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
import { useEffect, useId, useState, type ReactNode } from "react";
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

/** What to type before anything is deleted or removed. */
export const CONFIRM_WORD = "DELETE";

/**
 * Asks before a destructive action; stays open and shows the error if it fails.
 * Deleting or removing something also needs CONFIRM_WORD typed in; actions that
 * keep the resource (Rotate, Regenerate) don't.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  pending,
  error,
  typeToConfirm = /^(Delete|Remove)\b/.test(confirmLabel)
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  pending?: boolean;
  error?: unknown;
  /** Needs CONFIRM_WORD typed in; on by default for Delete and Remove. */
  typeToConfirm?: boolean;
}) {
  const [typed, setTyped] = useState("");
  const inputId = useId();
  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);
  const confirmed = !typeToConfirm || typed.trim() === CONFIRM_WORD;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {Boolean(error) && <Alert variant="error">{errorMessage(error)}</Alert>}
        {typeToConfirm && (
          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-[13px]">
              Type <span className="font-mono font-medium">{CONFIRM_WORD}</span>{" "}
              to confirm
            </label>
            <Input
              id={inputId}
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              onKeyDown={(event) => {
                if (event.key === "Enter" && confirmed && !pending) onConfirm();
              }}
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={pending}
            disabled={!confirmed}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

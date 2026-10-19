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
import { Check, Copy } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { CopyField } from "~/components/data/copy-field";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { toast } from "~/components/ui/sonner";

export type SecretField = { label: string; value: string };

/**
 * A secret the only time it can be read (an API key, a signing secret): copy fields, an
 * optional snippet, and Done once the user confirms they saved it. Clicking outside doesn't
 * close it, so the secret isn't lost by accident.
 */
export function SecretDialog({
  title,
  description = "This is the only time we'll show it.",
  fields,
  children,
  onDone
}: {
  title: string;
  description?: ReactNode;
  /** What to show; the dialog is open while set. */
  fields?: SecretField[];
  /** Extra content under the fields, such as a code snippet. */
  children?: ReactNode;
  onDone: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const checkboxId = useId();
  const shown = fields?.map((f) => f.value).join("");

  useEffect(() => setSaved(false), [shown]);

  return (
    <Dialog
      open={Boolean(fields)}
      onOpenChange={(open) => {
        if (!open && saved) onDone();
      }}
    >
      <DialogContent
        className="sm:max-w-[560px]"
        onEscapeKeyDown={(event) => !saved && event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {fields && (
          <div className="flex flex-col gap-4">
            {fields.map((f) => (
              <CopyField key={f.label} label={f.label} value={f.value} />
            ))}
            {children}
          </div>
        )}
        <DialogFooter className="items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={saved}
              onCheckedChange={(checked) => setSaved(checked === true)}
            />
            <Label htmlFor={checkboxId} className="font-display text-sm">
              I&apos;ve saved it
            </Label>
          </div>
          <Button disabled={!saved} onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** A small code sample with a copy button. */
export function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      className="relative rounded-control border border-border bg-surface-sunken"
    >
      <pre className="whitespace-pre-wrap break-all px-3 py-2.5 pr-10 text-xs leading-5 text-foreground">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={`Copy ${label}`}
        className="absolute right-2 top-2 cursor-pointer rounded-[6px] p-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        {copied ? (
          <Check className="size-[15px]" />
        ) : (
          <Copy className="size-[15px]" />
        )}
      </button>
    </div>
  );
}

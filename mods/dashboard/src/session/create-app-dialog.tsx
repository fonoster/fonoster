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
import { useEffect, useState, type FormEvent } from "react";
import { DOCS_URL } from "~/app/shell/nav";
import { useNavigate, useParams } from "react-router-dom";
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
import { errorMessage, useSessionMutation } from "./api";
import {
  blankApp,
  ConnectionFields,
  validateApp,
  type Draft,
  type SetDraft
} from "./apps";
import { STARTERS } from "./starters";

/**
 * Creates an app from its name, URL and protocol, then opens it (like New agent). The
 * right pane shows the smallest server for the chosen protocol.
 */
export function CreateAppDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { workspaceRef } = useParams();
  const [app, setApp] = useState<Draft>(blankApp);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const create = useSessionMutation(
    (api, draft: Omit<Draft, "signingSecretHint">) => api.saveApp(draft),
    { success: "App created" }
  );
  const set: SetDraft = (key, value) => setApp((a) => ({ ...a, [key]: value }));

  useEffect(() => {
    if (!open) return;
    setApp(blankApp);
    setErrors({});
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateApp(app);
    setErrors(found);
    if (Object.keys(found).length) return;
    const { signingSecretHint: _hint, ...rest } = app;
    create.mutate(rest, {
      onSuccess: (saved) => {
        onOpenChange(false);
        navigate(`/w/${workspaceRef}/apps/${saved.ref}`, {
          state: { secret: saved.signingSecret }
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>New app</DialogTitle>
          <DialogDescription>
            Point Fonoster at your voice server. It dials this WebSocket URL for
            every call.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <form
            id="create-app-form"
            onSubmit={submit}
            noValidate
            className="flex flex-col gap-5"
          >
            {create.error && (
              <Alert variant="error">{errorMessage(create.error)}</Alert>
            )}
            <ConnectionFields app={app} set={set} errors={errors} />
            <p className="rounded-control bg-muted px-3 py-2.5 text-xs text-muted-foreground">
              To receive calls, point a number at this app from Numbers after
              you create it.
            </p>
          </form>
          <StarterPane protocol={app.protocol} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-app-form"
            loading={create.isPending}
          >
            Create app
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The starter server for a protocol, with Copy and the command that runs it. */
function StarterPane({ protocol }: { protocol: Draft["protocol"] }) {
  const starter = STARTERS[protocol];
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(starter.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Selecting the text still works.
    }
  };
  return (
    <section
      aria-label="Starter server"
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-background p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs text-muted-foreground">
          {starter.file}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex cursor-pointer items-center gap-1.5 rounded-control px-1.5 py-1 text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check className="size-3.5" aria-hidden />
          ) : (
            <Copy className="size-3.5" aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {/* Focusable so keyboard users can scroll a long line. */}
      <pre
        tabIndex={0}
        className="flex-1 overflow-x-auto rounded-[6px] text-[12px] leading-5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <code>{starter.code}</code>
      </pre>
      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          Run it locally and expose it, each in its own terminal:
        </span>
        <pre
          tabIndex={0}
          className="overflow-x-auto rounded-[6px] text-[12px] leading-5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <code>{starter.run}</code>
        </pre>
        <a
          href={`${DOCS_URL}${starter.docs}`}
          target="_blank"
          rel="noreferrer"
          className="self-start pt-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Full guide →
        </a>
      </div>
    </section>
  );
}

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
// Role is a TS enum in a CommonJS package the browser build can't import
// values from, so roles are written as their string values.
import type { Role } from "@fonoster/types";
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
import { Select } from "~/components/ui/select";
import { errorMessage } from "~/lib/errors";
import { useCreateApiKey } from "./api-keys.service";
import type { CreatedKey } from "./secret-dialog";

// The API only accepts admin keys for now
// (common/src/validators/identity.ts createApiKeyRequestSchema).
const ROLE_OPTIONS = [
  {
    value: "WORKSPACE_ADMIN",
    label: "Workspace admin",
    description: "Full access to this workspace's resources."
  }
];

const DAY = 24 * 60 * 60;

export const EXPIRY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "30", label: "In 30 days" },
  { value: "90", label: "In 90 days" },
  { value: "365", label: "In 1 year" }
];

/** Epoch seconds `days` from now, or undefined for a key that never expires. */
export function expiresAtFor(choice: string, now = Date.now()) {
  if (choice === "never") return undefined;
  return Math.floor(now / 1000) + Number(choice) * DAY;
}

/** Picks a role and expiry, creates the key and hands back its secret. */
export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (key: CreatedKey) => void;
}) {
  const create = useCreateApiKey();
  const [role, setRole] = useState<string>("WORKSPACE_ADMIN");
  const [expiry, setExpiry] = useState("never");

  useEffect(() => {
    if (!open) return;
    setRole("WORKSPACE_ADMIN");
    setExpiry("never");
    create.reset();
    // Reset each time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const expiresAt = expiresAtFor(expiry);
    const key = await create.mutateAsync({
      role: role as Role,
      ...(expiresAt ? { expiresAt } : {})
    });
    onOpenChange(false);
    onCreated(key);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <DialogDescription>
            Use it with the SDK or the ctl CLI. You&apos;ll see the secret once,
            right after creating it.
          </DialogDescription>
        </DialogHeader>
        <form
          id="api-key-form"
          className="flex flex-col gap-[22px]"
          onSubmit={(event) => void submit(event).catch(() => {})}
          noValidate
        >
          {create.error && (
            <Alert variant="error">{errorMessage(create.error)}</Alert>
          )}
          <Field label="Role">
            {(a11y) => (
              <Select
                {...a11y}
                value={role}
                onValueChange={setRole}
                options={ROLE_OPTIONS}
              />
            )}
          </Field>
          <Field label="Expires">
            {(a11y) => (
              <Select
                {...a11y}
                value={expiry}
                onValueChange={setExpiry}
                options={EXPIRY_OPTIONS}
              />
            )}
          </Field>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="api-key-form" loading={create.isPending}>
            Create API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

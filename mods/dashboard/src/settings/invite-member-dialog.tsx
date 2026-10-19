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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
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
import { Select } from "~/components/ui/select";
import { errorMessage } from "~/lib/errors";
import { useInviteMember } from "./settings.service";

export const ROLE_OPTIONS = [
  {
    value: "WORKSPACE_MEMBER",
    label: "Member",
    description: "Builds and runs agents, streams and numbers."
  },
  {
    value: "WORKSPACE_ADMIN",
    label: "Admin",
    description: "Also manages members, API keys and settings."
  }
];

// Same rules as the API (common/src/validators/identity.ts).
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter their name")
    .max(50, "Use at most 50 characters"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["WORKSPACE_MEMBER", "WORKSPACE_ADMIN"])
});

type Values = z.infer<typeof schema>;

/** Invites someone by email; they join once they accept. */
export function InviteMemberDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const invite = useInviteMember();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: "WORKSPACE_MEMBER" }
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset();
    invite.reset();
    // Reset each time the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    await invite.mutateAsync({ ...values, role: values.role as Role });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            We&apos;ll email them a link to join this workspace.
          </DialogDescription>
        </DialogHeader>
        <form
          id="invite-form"
          onSubmit={(event) => void onSubmit(event).catch(() => {})}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {invite.error && (
            <Alert variant="error">{errorMessage(invite.error)}</Alert>
          )}
          <Field label="Name" error={errors.name?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("name")}
                placeholder="Ana Pérez"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Email" error={errors.email?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("email")}
                type="email"
                placeholder="ana@acme.com"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Role" error={errors.role?.message}>
            {(a11y) => (
              <Controller
                control={form.control}
                name="role"
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={ROLE_OPTIONS}
                  />
                )}
              />
            )}
          </Field>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="invite-form" loading={invite.isPending}>
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

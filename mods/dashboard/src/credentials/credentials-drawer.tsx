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
import type { Credentials } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage } from "~/lib/errors";
import {
  useCreateCredentials,
  useUpdateCredentials
} from "./credentials.service";

// Same rules as the API (common/src/validators/sipnet/credentials.ts, common.ts).
const base = {
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(64, "Use at most 64 characters"),
  username: z
    .string()
    .trim()
    .min(1, "Enter a username")
    .regex(
      /^[a-z0-9._-]+$/,
      "Lowercase letters, numbers, dots, underscores and hyphens only"
    )
};

const createSchema = z.object({
  ...base,
  password: z.string().min(1, "Enter a password")
});
const editSchema = z.object({ ...base, password: z.string() });

type Values = z.infer<typeof createSchema>;

/** Create credentials, or rename them and replace the password. */
export function CredentialsDrawer({
  open,
  onOpenChange,
  credentials,
  usedBy = [],
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The credentials to edit; creates new ones when absent. */
  credentials?: Credentials;
  /** "Trunk · Claro (outbound)"-style labels of what uses them. */
  usedBy?: string[];
  onDelete?: (credentials: Credentials) => void;
}) {
  const create = useCreateCredentials();
  const update = useUpdateCredentials();
  const mutation = credentials ? update : create;
  const form = useForm<Values>({
    resolver: zodResolver(credentials ? editSchema : createSchema),
    defaultValues: { name: "", username: "", password: "" }
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: credentials?.name ?? "",
      username: credentials?.username ?? "",
      password: ""
    });
    create.reset();
    update.reset();
    // Reset when the drawer opens for (different) credentials.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, credentials?.ref]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (credentials) {
      await update.mutateAsync({
        ref: credentials.ref,
        name: values.name,
        username: values.username,
        ...(values.password ? { password: values.password } : {})
      });
    } else {
      await create.mutateAsync(values);
    }
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={credentials ? credentials.name : "Add credentials"}
        description={
          credentials
            ? credentials.ref
            : "The password is stored encrypted and never shown again."
        }
        footer={
          <>
            {credentials && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(credentials)}
              >
                Delete credentials
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="credentials-form"
                loading={mutation.isPending}
              >
                Save
              </Button>
            </div>
          </>
        }
      >
        <form
          id="credentials-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {mutation.error && (
            <Alert variant="error">{errorMessage(mutation.error)}</Alert>
          )}
          <Field label="Name" error={errors.name?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("name")}
                placeholder="claro-acme"
                autoComplete="off"
              />
            )}
          </Field>
          <Field label="Username" error={errors.username?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("username")}
                placeholder="acme"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className="font-mono"
              />
            )}
          </Field>
          <Field
            label={credentials ? "New password" : "Password"}
            error={errors.password?.message}
            hint={
              credentials
                ? "Leave empty to keep the current password."
                : undefined
            }
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("password")}
                type="password"
                autoComplete="new-password"
                className="font-mono"
              />
            )}
          </Field>
          {credentials && (
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-[13px] font-medium">
                Used by
              </span>
              <p className="font-display text-[13px] text-muted-foreground">
                {usedBy.length > 0 ? usedBy.join(", ") : "Nothing yet"}
              </p>
            </div>
          )}
        </form>
      </SheetContent>
    </Sheet>
  );
}

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
import type { Secret } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { Textarea } from "~/components/ui/textarea";
import { errorMessage } from "~/lib/errors";
import { useCreateSecret, useUpdateSecret } from "./secrets.service";

// Same rules as the API (common/src/validators/secrets.ts).
const name = z
  .string()
  .trim()
  .min(3, "Use at least 3 characters")
  .max(32, "Use at most 32 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscores and hyphens only");

const createSchema = z.object({
  name,
  secret: z.string().min(1, "Enter the value")
});
const editSchema = z.object({ name, secret: z.string() });

type Values = z.infer<typeof createSchema>;

/** Create a secret, or rename/replace one. The stored value is never shown. */
export function SecretDrawer({
  open,
  onOpenChange,
  secret,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The secret to edit; creates a new one when absent. */
  secret?: Secret;
  onDelete?: (secret: Secret) => void;
}) {
  const create = useCreateSecret();
  const update = useUpdateSecret();
  const mutation = secret ? update : create;
  const form = useForm<Values>({
    resolver: zodResolver(secret ? editSchema : createSchema),
    defaultValues: { name: "", secret: "" }
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({ name: secret?.name ?? "", secret: "" });
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) secret.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, secret?.ref]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (secret) {
      await update.mutateAsync({
        ref: secret.ref,
        name: values.name,
        ...(values.secret ? { secret: values.secret } : {})
      });
    } else {
      await create.mutateAsync(values);
    }
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={secret ? secret.name : "Add secret"}
        description={
          secret
            ? secret.ref
            : "Stored encrypted. You can replace the value later, not read it."
        }
        footer={
          <>
            {secret && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(secret)}
              >
                Delete secret
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
                form="secret-form"
                loading={mutation.isPending}
              >
                Save
              </Button>
            </div>
          </>
        }
      >
        <form
          id="secret-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {mutation.error && (
            <Alert variant="error">{errorMessage(mutation.error)}</Alert>
          )}
          <Field
            label="Name"
            error={errors.name?.message}
            hint="Reference it from agents and voice apps by this name."
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("name")}
                placeholder="OPENAI_API_KEY"
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            label={secret ? "New value" : "Value"}
            error={errors.secret?.message}
            hint={secret ? "Leave empty to keep the current value." : undefined}
          >
            {(a11y) => (
              <Textarea
                {...a11y}
                {...form.register("secret")}
                rows={4}
                spellCheck={false}
                autoComplete="off"
                className="font-mono"
              />
            )}
          </Field>
        </form>
      </SheetContent>
    </Sheet>
  );
}

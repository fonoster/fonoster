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
import type { Acl } from "@fonoster/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage } from "~/lib/errors";
import { useCreateAcl, useUpdateAcl } from "./acls.service";
import { isAllowedEntry } from "./cidr";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(64, "Use at most 64 characters"),
  allow: z
    .array(
      z.object({
        value: z
          .string()
          .trim()
          .min(1, "Enter an IP address or range")
          .refine(
            isAllowedEntry,
            "Use an IPv4 address or range, like 10.0.0.0/16"
          )
      })
    )
    .min(1, "Add at least one IP address or range")
});

type Values = z.infer<typeof schema>;

const blank = { value: "" };

/** Create an ACL, or rename one and change its allow list. */
export function AclDrawer({
  open,
  onOpenChange,
  acl,
  usedBy = [],
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The ACL to edit; creates a new one when absent. */
  acl?: Acl;
  /** "Trunk · Claro"-style labels of what uses the ACL. */
  usedBy?: string[];
  onDelete?: (acl: Acl) => void;
}) {
  const create = useCreateAcl();
  const update = useUpdateAcl();
  const mutation = acl ? update : create;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", allow: [blank] }
  });
  const allow = useFieldArray({ control: form.control, name: "allow" });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: acl?.name ?? "",
      allow: acl?.allow?.length
        ? acl.allow.map((value) => ({ value }))
        : [blank]
    });
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) ACL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, acl?.ref]);

  const onSubmit = form.handleSubmit(async (values) => {
    const request = {
      name: values.name,
      allow: values.allow.map((entry) => entry.value)
    };
    if (acl) {
      await update.mutateAsync({ ref: acl.ref, ...request });
    } else {
      await create.mutateAsync(request);
    }
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={acl ? acl.name : "New ACL"}
        description={
          acl
            ? acl.ref
            : "Only traffic from these addresses gets through. Everything else is rejected."
        }
        footer={
          <>
            {acl && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(acl)}
              >
                Delete ACL
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
                form="acl-form"
                loading={mutation.isPending}
              >
                {acl ? "Save" : "Create ACL"}
              </Button>
            </div>
          </>
        }
      >
        <form
          id="acl-form"
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
                placeholder="Claro signaling IPs"
                autoComplete="off"
              />
            )}
          </Field>

          <fieldset className="flex flex-col gap-1.5">
            <legend className="font-display text-[13px] font-medium text-foreground">
              Allow
            </legend>
            <p className="font-display text-xs text-text-secondary">
              One IPv4 address or CIDR range per row, like 190.80.12.0/24.
            </p>
            <ul className="flex flex-col gap-2 pt-1">
              {allow.fields.map((entry, index) => {
                const error = errors.allow?.[index]?.value?.message;
                const errorId = `acl-allow-${index}-error`;
                return (
                  <li key={entry.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Input
                        {...form.register(`allow.${index}.value`)}
                        aria-label={`Allowed address ${index + 1}`}
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? errorId : undefined}
                        placeholder="10.0.0.0/16"
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove allowed address ${index + 1}`}
                        disabled={allow.fields.length === 1}
                        onClick={() => allow.remove(index)}
                      >
                        <X aria-hidden className="size-4" />
                      </Button>
                    </div>
                    {error && (
                      <p
                        id={errorId}
                        role="alert"
                        className="text-xs text-destructive"
                      >
                        {error}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
            {errors.allow?.root?.message && (
              <p role="alert" className="text-xs text-destructive">
                {errors.allow.root.message}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1 self-start"
              onClick={() => allow.append(blank)}
            >
              <Plus aria-hidden className="size-4" /> Add address
            </Button>
          </fieldset>

          {acl && (
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

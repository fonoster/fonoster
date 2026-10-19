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
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useCapabilities } from "~/lib/capabilities";
import { errorMessage } from "~/lib/errors";
import {
  phoneOf,
  useAclLookup,
  useCreateDomain,
  useNumberLookup,
  useUpdateDomain,
  type DomainRow
} from "./domains.service";

const NONE = "__none";

function isRegex(value: string) {
  try {
    new RegExp(value);
    return true;
  } catch {
    return false;
  }
}

// Same rules as the API (common/src/validators/sipnet/domains.ts).
export function domainSchema(rootDomain: string) {
  return z.object({
    name: z.string().trim().min(1, "Enter a name"),
    domainUri: z
      .string()
      .trim()
      .regex(
        /^[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+$/,
        `Use a domain like acme.${rootDomain}`
      )
      .refine((uri) => uri.endsWith(rootDomain), {
        message: `Must end with ${rootDomain}`
      }),
    aclRef: z.string(),
    egressPolicies: z.array(
      z.object({
        rule: z
          .string()
          .trim()
          .min(1, "Enter a pattern")
          .regex(/^[^:]+$/, "Patterns can't contain “:”")
          .refine(isRegex, "Not a valid regular expression"),
        numberRef: z.string().min(1, "Pick a number")
      })
    )
  });
}

type Values = z.infer<ReturnType<typeof domainSchema>>;

/** Add a domain, or edit its name, ACL and egress rules. */
export function DomainDrawer({
  open,
  onOpenChange,
  domain,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The domain to edit; adds a new one when absent. */
  domain?: DomainRow;
  onDelete?: (domain: DomainRow) => void;
}) {
  const { domain: rootDomain } = useCapabilities();
  const create = useCreateDomain();
  const update = useUpdateDomain();
  const mutation = domain ? update : create;
  const acls = useAclLookup();
  const numbers = useNumberLookup();
  const schema = useMemo(() => domainSchema(rootDomain), [rootDomain]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", domainUri: "", aclRef: NONE, egressPolicies: [] }
  });
  const rules = useFieldArray({
    control: form.control,
    name: "egressPolicies"
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: domain?.name ?? "",
      domainUri: domain?.domainUri ?? "",
      aclRef: domain?.accessControlList?.ref ?? NONE,
      egressPolicies:
        domain?.egressPolicies.map(({ rule, numberRef }) => ({
          rule,
          numberRef
        })) ?? []
    });
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) domain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, domain?.ref]);

  const aclOptions = [
    { value: NONE, label: "None" },
    ...acls.items.map((acl) => ({ value: acl.ref, label: acl.name }))
  ];
  const numberOptions = numbers.items.map((number) => ({
    value: number.ref,
    label: phoneOf(number) ?? number.ref,
    description: number.name
  }));

  const onSubmit = form.handleSubmit(async (values) => {
    const aclRef = values.aclRef === NONE ? undefined : values.aclRef;
    const egressPolicies = values.egressPolicies.map(({ rule, numberRef }) => ({
      rule,
      numberRef
    }));
    if (domain) {
      await update.mutateAsync({
        ref: domain.ref,
        name: values.name,
        // An empty ref asks the API to drop the ACL.
        accessControlListRef: aclRef ?? "",
        egressPolicies
      });
    } else {
      await create.mutateAsync({
        name: values.name,
        domainUri: values.domainUri,
        ...(aclRef ? { accessControlListRef: aclRef } : {}),
        egressPolicies
      });
    }
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={domain ? domain.name : "New domain"}
        description={
          domain
            ? domain.ref
            : "A SIP domain your phones and softphones register to."
        }
        footer={
          <>
            {domain && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(domain)}
              >
                Delete domain
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
                form="domain-form"
                loading={mutation.isPending}
              >
                {domain ? "Save" : "Create domain"}
              </Button>
            </div>
          </>
        }
      >
        <form
          id="domain-form"
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
                placeholder="Acme HQ"
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            label="Domain URI"
            error={errors.domainUri?.message}
            hint={
              domain
                ? "The URI can't be changed. Add a new domain instead."
                : `Must end with ${rootDomain}.`
            }
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("domainUri")}
                placeholder={`acme.${rootDomain}`}
                autoComplete="off"
                spellCheck={false}
                disabled={Boolean(domain)}
                className="font-mono"
              />
            )}
          </Field>
          <Field
            label="Access control list"
            hint="Which IPs and networks may send traffic to this domain."
          >
            {(a11y) => (
              <Controller
                control={form.control}
                name="aclRef"
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={aclOptions}
                  />
                )}
              />
            )}
          </Field>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="mb-1.5 font-display text-[13px] font-medium text-foreground">
              Egress rules
            </legend>
            <p className="font-display text-xs text-text-secondary">
              When a SIP agent dials a number matching the pattern, the call
              goes out with this caller ID.
            </p>
            {rules.fields.map((row, index) => {
              const rowErrors = errors.egressPolicies?.[index];
              const message =
                rowErrors?.rule?.message ?? rowErrors?.numberRef?.message;
              return (
                <div key={row.id} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Input
                      {...form.register(`egressPolicies.${index}.rule`)}
                      aria-label={`Rule ${index + 1} pattern`}
                      aria-invalid={Boolean(rowErrors?.rule)}
                      placeholder="^\+1"
                      autoComplete="off"
                      spellCheck={false}
                      className="flex-1 font-mono"
                    />
                    <span aria-hidden className="text-muted-foreground">
                      →
                    </span>
                    <Controller
                      control={form.control}
                      name={`egressPolicies.${index}.numberRef`}
                      render={({ field }) => (
                        <Select
                          aria-label={`Rule ${index + 1} number`}
                          aria-invalid={Boolean(rowErrors?.numberRef)}
                          value={field.value}
                          onValueChange={field.onChange}
                          options={numberOptions}
                          placeholder="Number"
                          className="flex-1"
                        />
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove rule ${index + 1}`}
                      onClick={() => rules.remove(index)}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  {message && (
                    <p role="alert" className="text-xs text-destructive">
                      {message}
                    </p>
                  )}
                </div>
              );
            })}
            {numbers.isSuccess && numberOptions.length === 0 ? (
              <p className="font-display text-xs text-muted-foreground">
                Add a number first to use it as a caller ID.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => rules.append({ rule: "", numberRef: "" })}
              >
                <Plus className="size-3.5" aria-hidden /> Add rule
              </Button>
            )}
          </fieldset>
        </form>
      </SheetContent>
    </Sheet>
  );
}

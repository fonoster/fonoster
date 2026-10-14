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
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useDomains } from "~/domains/domains.service";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { Switch } from "~/components/ui/switch";
import { errorMessage } from "~/lib/errors";
import {
  asPrivacy,
  DEFAULT_EXPIRES,
  sipUri,
  useCreateSipUser,
  useCredentialsLookup,
  useUpdateSipUser,
  type SipUserRow
} from "./sip-users.service";

const NONE = "__none";

// Same rules as the API (common/src/validators/sipnet/agents.ts).
export const sipUserSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  username: z
    .string()
    .trim()
    .min(1, "Enter a username")
    .regex(
      /^[a-z0-9._-]+$/,
      "Lowercase letters, numbers, dots, underscores and hyphens only"
    ),
  domainRef: z.string().min(1, "Pick a domain"),
  credentialsRef: z.string(),
  privacy: z.enum(["NONE", "PRIVATE"]),
  maxContacts: z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number")
    .refine((value) => Number(value) >= 1 && Number(value) <= 100, {
      message: "Between 1 and 100"
    }),
  enabled: z.boolean()
});

type Values = z.infer<typeof sipUserSchema>;

const privacyOptions = [
  { value: "NONE", label: "None", description: "Show the caller ID" },
  { value: "PRIVATE", label: "Private", description: "Hide the caller ID" }
];

/** Add a SIP user, or edit one (the username is fixed once created). */
export function SipUserDrawer({
  open,
  onOpenChange,
  sipUser,
  onDelete
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The SIP user to edit; adds a new one when absent. */
  sipUser?: SipUserRow;
  onDelete?: (sipUser: SipUserRow) => void;
}) {
  const create = useCreateSipUser();
  const update = useUpdateSipUser();
  const mutation = sipUser ? update : create;
  const domains = useDomains();
  const credentials = useCredentialsLookup();
  const form = useForm<Values>({
    resolver: zodResolver(sipUserSchema),
    defaultValues: {
      name: "",
      username: "",
      domainRef: "",
      credentialsRef: NONE,
      privacy: "NONE",
      maxContacts: "1",
      enabled: true
    }
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: sipUser?.name ?? "",
      username: sipUser?.username ?? "",
      domainRef: sipUser?.domain?.ref ?? "",
      credentialsRef: sipUser?.credentials?.ref ?? NONE,
      privacy: sipUser?.privacy ?? "NONE",
      maxContacts: String(sipUser?.maxContacts ?? 1),
      enabled: sipUser?.enabled ?? true
    });
    create.reset();
    update.reset();
    // Reset when the drawer opens for a (different) SIP user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sipUser?.ref]);

  const domainOptions = domains.rows.map((domain) => ({
    value: domain.ref,
    label: domain.domainUri,
    description: domain.name
  }));
  const credentialOptions = [
    { value: NONE, label: "None" },
    ...credentials.items.map((item) => ({
      value: item.ref,
      label: item.name,
      description: item.username
    }))
  ];

  const onSubmit = form.handleSubmit(async (values) => {
    const common = {
      name: values.name,
      domainRef: values.domainRef,
      privacy: asPrivacy(values.privacy),
      maxContacts: Number(values.maxContacts),
      enabled: values.enabled
    };
    const credentialsRef =
      values.credentialsRef === NONE ? undefined : values.credentialsRef;
    if (sipUser) {
      await update.mutateAsync({
        ref: sipUser.ref,
        ...common,
        // An empty ref asks the API to drop the credentials.
        credentialsRef: credentialsRef ?? ""
      });
    } else {
      await create.mutateAsync({
        ...common,
        username: values.username,
        expires: DEFAULT_EXPIRES,
        ...(credentialsRef ? { credentialsRef } : {})
      });
    }
    onOpenChange(false);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title={sipUser ? sipUser.name : "Add SIP user"}
        description={
          sipUser
            ? sipUri(sipUser)
            : "A phone, softphone or desk that registers to one of your domains."
        }
        footer={
          <>
            {sipUser && onDelete ? (
              <button
                type="button"
                className="cursor-pointer font-display text-[13px] text-destructive hover:underline"
                onClick={() => onDelete(sipUser)}
              >
                Delete SIP user
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
                form="sip-user-form"
                loading={mutation.isPending}
              >
                Save
              </Button>
            </div>
          </>
        }
      >
        <form
          id="sip-user-form"
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
                placeholder="Front desk phone"
                autoComplete="off"
              />
            )}
          </Field>
          <Field
            label="Username"
            error={errors.username?.message}
            hint={
              sipUser
                ? "The username can't be changed."
                : "The user part of the SIP address, e.g. maria."
            }
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("username")}
                placeholder="maria"
                autoComplete="off"
                spellCheck={false}
                disabled={Boolean(sipUser)}
                className="font-mono"
              />
            )}
          </Field>
          <Field
            label="Domain"
            error={errors.domainRef?.message}
            hint={
              domains.isSuccess && domainOptions.length === 0
                ? "Add a domain first."
                : undefined
            }
          >
            {(a11y) => (
              <Controller
                control={form.control}
                name="domainRef"
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={domainOptions}
                    placeholder="Select a domain"
                  />
                )}
              />
            )}
          </Field>
          <Field
            label="Credentials"
            hint="The username and password the device signs in with."
          >
            {(a11y) => (
              <Controller
                control={form.control}
                name="credentialsRef"
                render={({ field }) => (
                  <Select
                    {...a11y}
                    value={field.value}
                    onValueChange={field.onChange}
                    options={credentialOptions}
                  />
                )}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Privacy">
              {(a11y) => (
                <Controller
                  control={form.control}
                  name="privacy"
                  render={({ field }) => (
                    <Select
                      {...a11y}
                      value={field.value}
                      onValueChange={field.onChange}
                      options={privacyOptions}
                    />
                  )}
                />
              )}
            </Field>
            <Field
              label="Max contacts"
              error={errors.maxContacts?.message}
              hint="Devices registered at once."
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("maxContacts")}
                  inputMode="numeric"
                  autoComplete="off"
                />
              )}
            </Field>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="sip-user-enabled">Enabled</Label>
              <p className="font-display text-xs text-text-secondary">
                Disabled users can't register or make calls.
              </p>
            </div>
            <Controller
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <Switch
                  id="sip-user-enabled"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

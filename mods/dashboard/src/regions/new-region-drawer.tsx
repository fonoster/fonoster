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
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { errorMessage } from "~/lib/errors";
import { REGIONS_KEY, useRegionsApi } from "./api";
import type { CreatedRegion } from "./types";
import { validateRegionId, validateSipDomain } from "./validation";

const schema = z.object({
  id: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      const m = validateRegionId(v);
      if (m) ctx.addIssue({ code: "custom", message: m });
    }),
  displayName: z.string().trim().min(1, "Enter a name").max(60),
  sipDomain: z
    .string()
    .trim()
    .superRefine((v, ctx) => {
      const m = validateSipDomain(v);
      if (m) ctx.addIssue({ code: "custom", message: m });
    })
});
type Values = z.infer<typeof schema>;

/** New region, in the right-side drawer: ID, display name and SIP domain. `onCreated` gets the one-time token. */
export function NewRegionDrawer({
  open,
  onOpenChange,
  onCreated
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: CreatedRegion) => void;
}) {
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const [error, setError] = useState<unknown>();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { id: "", displayName: "", sipDomain: "" }
  });
  const { errors, isSubmitting } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset();
    setError(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    setError(undefined);
    try {
      const created = await api.createRegion(values);
      await queryClient.invalidateQueries({ queryKey: REGIONS_KEY });
      form.reset();
      onCreated(created);
      onOpenChange(false);
    } catch (e) {
      setError(e);
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        title="New region"
        description="Connect a private region to this workspace. You'll get a one-time token to enroll it."
        footer={
          <>
            <span />
            <div className="flex gap-2.5">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form="region-form" loading={isSubmitting}>
                Create region
              </Button>
            </div>
          </>
        }
      >
        <form
          id="region-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-[22px]"
          noValidate
        >
          {error !== undefined && (
            <Alert variant="error">{errorMessage(error)}</Alert>
          )}
          <Field
            label="ID"
            error={errors.id?.message}
            hint="Lowercase, for example acme-dallas. It can't change later."
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("id")}
                placeholder="acme-dallas"
                autoFocus
              />
            )}
          </Field>
          <Field label="Display name" error={errors.displayName?.message}>
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("displayName")}
                placeholder="Acme Dallas"
              />
            )}
          </Field>
          <Field
            label="SIP domain"
            error={errors.sipDomain?.message}
            hint="Point *.sip.acme.com at the region and provide its TLS certificate."
          >
            {(a11y) => (
              <Input
                {...a11y}
                {...form.register("sipDomain")}
                placeholder="sip.acme.com"
              />
            )}
          </Field>
        </form>
      </SheetContent>
    </Sheet>
  );
}

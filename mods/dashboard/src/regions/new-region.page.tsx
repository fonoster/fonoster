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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { errorMessage } from "~/lib/errors";
import { REGIONS_KEY, useRegionsApi } from "./api";
import { StartLayout } from "./start-layout";
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

/** /regions/new: a private region is created at the user level (PR-15). */
export default function NewRegionPage() {
  const api = useRegionsApi();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<unknown>();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { id: "", displayName: "", sipDomain: "" }
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setError(undefined);
    try {
      const { ref, token, expiresAt } = await api.createRegion(values);
      await queryClient.invalidateQueries({ queryKey: REGIONS_KEY });
      navigate(`/regions/${ref}/setup`, {
        replace: true,
        state: { enrollment: { token, expiresAt } }
      });
    } catch (e) {
      setError(e);
    }
  });

  return (
    <StartLayout title="New region">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
        <Button type="submit" loading={isSubmitting} className="self-start">
          Create region
        </Button>
      </form>
    </StartLayout>
  );
}

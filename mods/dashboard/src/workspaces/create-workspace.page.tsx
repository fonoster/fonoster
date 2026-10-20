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
import { ArrowLeft, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthLayout, authButton, authInput } from "~/auth/auth-layout";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { rememberWorkspace, workspacePath } from "./workspace-session";
import { usePrivateRegions } from "~/lib/capabilities";
import { useRegionsApi } from "~/regions/api";
import { RegionPicker } from "~/regions/region-picker";
import { DEFAULT_REGION_ID } from "~/regions/types";
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  useCurrentUser,
  useWorkspaces,
  WORKSPACES_KEY
} from "./workspaces.service";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(50, "Use at most 50 characters")
});

export default function CreateWorkspacePage() {
  const { user } = useAuth();
  const { data: profile } = useCurrentUser();
  const { data: workspaces } = useWorkspaces();
  const regionsApi = useRegionsApi();
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: (input: { name: string; region: string }) =>
      regionsApi.createWorkspace(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY })
  });
  // Without private regions there is nothing to pick: the public `default`.
  const privateRegions = usePrivateRegions();
  const [region, setRegion] = useState(DEFAULT_REGION_ID);
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" }
  });
  const first = workspaces?.length === 0;
  const firstName = (profile?.name || user?.email || "").split(/[\s@]/)[0];

  const onSubmit = form.handleSubmit(async ({ name }) => {
    const { ref } = await create.mutateAsync({ name, region });
    rememberWorkspace(ref);
    navigate(workspacePath(ref), { replace: true });
  });

  return (
    <AuthLayout
      title={
        first ? `Welcome${firstName ? `, ${firstName}` : ""}` : "New workspace"
      }
      description={
        privateRegions ? "Name it and pick where it runs." : "Name it to start."
      }
      footer={
        first ? (
          <>
            <Mail className="size-[15px]" aria-hidden />
            Expecting an invite? Open the link in the email; the workspace shows
            up here.
          </>
        ) : (
          <Link
            to="/workspaces"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back to workspaces
          </Link>
        )
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {create.error && (
          <Alert variant="error">{errorMessage(create.error)}</Alert>
        )}
        <Field
          label="Workspace name"
          error={form.formState.errors.name?.message}
        >
          {(a11y) => (
            <Input
              {...a11y}
              {...form.register("name")}
              placeholder="Acme Support"
              autoFocus
              className={authInput}
            />
          )}
        </Field>
        {privateRegions && <RegionPicker value={region} onChange={setRegion} />}
        <Button type="submit" className={authButton} loading={create.isPending}>
          Create workspace
        </Button>
      </form>
    </AuthLayout>
  );
}

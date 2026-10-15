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
import { authButton, authInput } from "~/auth/auth-layout";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useAuth } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { UserBar } from "./user-bar";
import { rememberWorkspace, workspacePath } from "./workspace-session";
import { useRegionsApi } from "~/regions/api";
import { RegionPicker } from "~/regions/region-picker";
import { DEFAULT_REGION, PRIVATE_REGION } from "~/regions/types";
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
  const [region, setRegion] = useState(DEFAULT_REGION.id);
  const [confirming, setConfirming] = useState<string | undefined>();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" }
  });
  const first = workspaces?.length === 0;
  const firstName = (profile?.name || user?.email || "").split(/[\s@]/)[0];

  const createWith = async (name: string) => {
    const { ref, enrollment } = await create.mutateAsync({ name, region });
    rememberWorkspace(ref);
    if (region === PRIVATE_REGION)
      navigate(`${workspacePath(ref)}/region-setup`, {
        replace: true,
        state: { enrollment }
      });
    else navigate(workspacePath(ref), { replace: true });
  };

  // A private region is permanent, so it gets a confirm step first.
  const onSubmit = form.handleSubmit(async ({ name }) => {
    if (region === PRIVATE_REGION) setConfirming(name);
    else await createWith(name);
  });

  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className="flex flex-1 justify-center px-4 pb-20 pt-10">
        <div className="flex w-full max-w-[420px] flex-col gap-7">
          <h1 className="text-[26px] font-semibold">
            {first
              ? `Welcome${firstName ? `, ${firstName}` : ""}`
              : "New workspace"}
          </h1>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            {create.error && (
              <Alert variant="error">{errorMessage(create.error)}</Alert>
            )}
            <Field label="Name" error={form.formState.errors.name?.message}>
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
            <RegionPicker value={region} onChange={setRegion} />
            {confirming !== undefined ? (
              <div className="flex flex-col gap-3">
                <p className="font-display text-sm text-muted-foreground">
                  A private region runs on your own servers and can't be changed
                  later.
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setConfirming(undefined)}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    loading={create.isPending}
                    onClick={() => void createWith(confirming)}
                  >
                    Create
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="submit"
                className={authButton}
                loading={create.isPending}
              >
                Create
              </Button>
            )}
          </form>
          {first ? (
            <p className="flex items-center gap-2 font-display text-[13px] text-muted-foreground">
              <Mail className="size-[15px]" aria-hidden />
              Expecting an invite? Open the link in the email; the workspace
              shows up here.
            </p>
          ) : (
            <Link
              to="/workspaces"
              className="inline-flex items-center gap-1.5 font-display text-[13px] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden /> Back to workspaces
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

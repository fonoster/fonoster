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
import {
  useCreateWorkspace,
  useCurrentUser,
  useWorkspaces
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
  const create = useCreateWorkspace();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "" }
  });
  const first = workspaces?.length === 0;
  const firstName = (profile?.name || user?.email || "").split(/[\s@]/)[0];

  const onSubmit = form.handleSubmit(async ({ name }) => {
    const { ref } = await create.mutateAsync({ name });
    rememberWorkspace(ref);
    navigate(workspacePath(ref), { replace: true });
  });

  return (
    <div className="flex min-h-full flex-col bg-background">
      <UserBar />
      <main className="flex flex-1 justify-center px-4 pb-20 pt-10">
        <div className="flex w-full max-w-[420px] flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-semibold">
              {first
                ? `Welcome${firstName ? `, ${firstName}` : ""}`
                : "New workspace"}
            </h1>
            <p className="font-display text-sm text-muted-foreground">
              {first
                ? "You're not in any workspace yet. A workspace holds your agents, voice apps, numbers and calls. You name it now and invite your team later from Settings › Members."
                : "Create a workspace for another team's agents, numbers and calls."}
            </p>
          </div>
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
            <Button
              type="submit"
              className={authButton}
              loading={create.isPending}
            >
              Create workspace
            </Button>
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

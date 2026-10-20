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
import { useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { CopyField } from "~/components/data/copy-field";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { toast } from "~/components/ui/sonner";
import { useAuth } from "~/lib/auth";
import { useTheme, type ThemePreference } from "~/lib/theme";
import { errorMessage } from "~/lib/errors";
import { useWorkspace } from "~/lib/workspace";
import {
  WORKSPACES_KEY,
  useCurrentUser
} from "~/workspaces/workspaces.service";
import { useDeleteWorkspace, useUpdateWorkspace } from "./settings.service";
import { TypeToConfirmDialog } from "./type-to-confirm-dialog";

// Same rules as the API (common/src/validators/identity.ts).
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name")
    .max(50, "Use at most 50 characters")
});

type Values = z.infer<typeof schema>;

/** A setting: what it is on the left, its value or control on the right. */
function SettingRow({
  title,
  description,
  htmlFor,
  children
}: {
  title: string;
  description?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border px-5 py-5 first:border-t-0 md:flex-row md:items-center md:gap-8">
      <div className="flex flex-col gap-1 md:w-[340px] md:shrink-0">
        {htmlFor ? (
          <label
            htmlFor={htmlFor}
            className="font-display text-sm font-medium text-foreground"
          >
            {title}
          </label>
        ) : (
          <span className="font-display text-sm font-medium text-foreground">
            {title}
          </span>
        )}
        {description && (
          <p className="font-display text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="min-w-0 flex-1 [&>*]:md:max-w-[420px] [&>form]:md:max-w-[500px]">
        {children}
      </div>
    </div>
  );
}

export function GeneralSettings() {
  const workspace = useWorkspace();
  const { user, access } = useAuth();
  const isOwner = Boolean(user?.sub) && workspace.ownerRef === user?.sub;
  // The API lets the owner and admins rename; members see the name only.
  const canRename =
    isOwner ||
    access.some(
      (a) =>
        a.accessKeyId === workspace.accessKeyId &&
        (a.role === "WORKSPACE_ADMIN" || a.role === "WORKSPACE_OWNER")
    );

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label="Workspace"
        className="rounded-xl border border-border bg-card"
      >
        <NameForm canRename={canRename} />
        <SettingRow
          title="Access key ID"
          description="Your workspace ID. The SDK and ctl need it together with an API key."
        >
          <CopyField
            label="Access key ID"
            value={workspace.accessKeyId}
            className="[&>span:first-child]:sr-only"
          />
        </SettingRow>
        <SettingRow title="Owner">
          <Owner isOwner={isOwner} />
        </SettingRow>
      </section>
      <Appearance />
      <DangerZone isOwner={isOwner} />
    </div>
  );
}

function NameForm({ canRename }: { canRename: boolean }) {
  const workspace = useWorkspace();
  const update = useUpdateWorkspace();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: workspace.name }
  });
  const { errors } = form.formState;
  const current = form.watch("name");

  useEffect(() => {
    form.reset({ name: workspace.name });
    // Follow the workspace when it changes (switch or rename).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.ref, workspace.name]);

  const onSubmit = form.handleSubmit((values) =>
    update.mutate({ ref: workspace.ref, name: values.name })
  );

  return (
    <SettingRow
      title="Workspace name"
      htmlFor="workspace-name"
      description={
        canRename
          ? "Shown in the workspace switcher and emails."
          : "Only the owner or an admin can rename the workspace."
      }
    >
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
        <div className="flex gap-2.5">
          <Input
            id="workspace-name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "workspace-name-error" : undefined}
            autoComplete="off"
            readOnly={!canRename}
            {...form.register("name")}
          />
          {canRename && (
            <Button
              type="submit"
              variant="outline"
              loading={update.isPending}
              disabled={current.trim() === workspace.name}
            >
              Save
            </Button>
          )}
        </div>
        {errors.name && (
          <p
            id="workspace-name-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {errors.name.message}
          </p>
        )}
        {update.error && (
          <Alert variant="error">{errorMessage(update.error)}</Alert>
        )}
      </form>
    </SettingRow>
  );
}

function Owner({ isOwner }: { isOwner: boolean }) {
  const workspace = useWorkspace();
  // The list may leave out the owner; when it's the current user, ask for them.
  const me = useCurrentUser();
  const owner =
    workspace.owner ??
    (isOwner && me.data
      ? { name: me.data.name, email: me.data.email }
      : undefined);

  if (!owner) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <p className="flex flex-wrap gap-x-3 text-sm">
      <span className="font-display font-medium text-foreground">
        {owner.name}
      </span>
      <span className="text-muted-foreground">{owner.email}</span>
    </p>
  );
}

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" }
];

/** The theme is a preference of this browser, not of the workspace. */
function Appearance() {
  const { preference, setPreference } = useTheme();

  return (
    <section
      aria-label="Appearance"
      className="rounded-xl border border-border bg-card"
    >
      <SettingRow
        title="Theme"
        description="Choose how the dashboard looks on this device."
      >
        <div role="radiogroup" aria-label="Theme" className="flex gap-2.5">
          {THEMES.map(({ value, label }) => (
            <Button
              key={value}
              type="button"
              role="radio"
              aria-checked={preference === value}
              variant={preference === value ? "secondary" : "outline"}
              onClick={() => setPreference(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </SettingRow>
    </section>
  );
}

function DangerZone({ isOwner }: { isOwner: boolean }) {
  const workspace = useWorkspace();
  const remove = useDeleteWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const onConfirm = () =>
    remove.mutate(workspace.ref, {
      onSuccess: () => {
        setConfirming(false);
        toast.success("Workspace deleted");
        navigate("/", { replace: true });
        void queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
      }
    });

  return (
    <section
      aria-label="Danger zone"
      className="flex flex-col gap-4 rounded-xl border border-destructive/60 bg-card px-5 py-5 md:flex-row md:items-center md:gap-8"
    >
      <div className="flex flex-col gap-1 md:w-[340px] md:shrink-0">
        <h2 className="font-display text-sm font-medium text-foreground">
          Delete workspace
        </h2>
        <p className="font-display text-xs text-muted-foreground">
          Removes agents, apps, numbers, trunks and call history. Can&apos;t be
          undone.
        </p>
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <Button
          variant="destructive"
          disabled={!isOwner}
          onClick={() => setConfirming(true)}
        >
          Delete workspace
        </Button>
        {!isOwner && (
          <p className="font-display text-xs text-muted-foreground">
            Only the workspace owner can delete it.
          </p>
        )}
      </div>
      <TypeToConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          setConfirming(open);
          if (!open) remove.reset();
        }}
        title={`Delete ${workspace.name}?`}
        description="Everything in this workspace is deleted for every member. This can't be undone."
        expected={workspace.name}
        confirmLabel="Delete workspace"
        pending={remove.isPending}
        error={remove.error}
        onConfirm={onConfirm}
      />
    </section>
  );
}

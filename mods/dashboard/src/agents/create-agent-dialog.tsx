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
import { BookOpen, Bell, FileText, Headset } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { useWorkspace } from "~/lib/workspace";
import { toRequest } from "./agent-form";
import { useCreateAgent } from "./agents.service";
import { LANGUAGES } from "./catalog";
import { TEMPLATES, templateValues, type TemplateId } from "./templates";

const ICONS: Record<TemplateId, typeof Headset> = {
  receptionist: Headset,
  reminders: Bell,
  knowledge: BookOpen,
  blank: FileText
};

const schema = z.object({
  template: z.enum(["receptionist", "reminders", "knowledge", "blank"]),
  name: z
    .string()
    .trim()
    .min(1, "Name the agent")
    .max(255, "Use at most 255 characters"),
  languageCode: z.string().min(1, "Pick a language")
});

type Values = z.infer<typeof schema>;

const INITIAL: Values = {
  template: "receptionist",
  name: "",
  languageCode: "en-US"
};

/** Creates an agent from a template, then opens it. */
export function CreateAgentDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateAgent();
  const navigate = useNavigate();
  const workspace = useWorkspace();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: INITIAL
  });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset(INITIAL);
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = form.handleSubmit(async (values) => {
    const request = toRequest(
      templateValues(values.template, values.name.trim(), values.languageCode)
    );
    const { ref } = await create.mutateAsync(request);
    onOpenChange(false);
    navigate(`/w/${workspace.ref}/agents/${ref}`);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>New agent</DialogTitle>
          <DialogDescription>
            Start from a template. You can change everything after.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-agent-form"
          onSubmit={onSubmit}
          noValidate
          className="flex flex-col gap-5"
        >
          {create.error && (
            <Alert variant="error">{errorMessage(create.error)}</Alert>
          )}
          <Controller
            control={form.control}
            name="template"
            render={({ field }) => (
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 font-display text-[13px] font-medium">
                  Template
                </legend>
                <div
                  role="radiogroup"
                  aria-label="Template"
                  className="grid gap-2.5 sm:grid-cols-2"
                >
                  {TEMPLATES.map((template) => {
                    const Icon = ICONS[template.id];
                    const selected = field.value === template.id;
                    const disabled = Boolean(template.comingSoon);
                    return (
                      <button
                        key={template.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        aria-disabled={disabled || undefined}
                        disabled={disabled}
                        title={template.comingSoon}
                        onClick={() => field.onChange(template.id)}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-control border p-3.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                          selected
                            ? "border-primary bg-brand-subtle"
                            : "border-border hover:bg-accent"
                        )}
                      >
                        <Icon
                          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="flex flex-col gap-0.5">
                          <span className="font-display text-sm font-medium">
                            {template.label}
                            {disabled && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground">
                                Coming soon
                              </span>
                            )}
                          </span>
                          <span className="font-display text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("name")}
                  placeholder="Front desk"
                  autoComplete="off"
                />
              )}
            </Field>
            <Field label="Language" error={errors.languageCode?.message}>
              {(a11y) => (
                <Controller
                  control={form.control}
                  name="languageCode"
                  render={({ field }) => (
                    <Select
                      {...a11y}
                      value={field.value}
                      onValueChange={field.onChange}
                      options={LANGUAGES}
                    />
                  )}
                />
              )}
            </Field>
          </div>
          <p className="font-display text-xs text-muted-foreground">
            We'll pick a matching voice and transcriber (Deepgram). Change them
            in Configure.
          </p>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-agent-form"
            loading={create.isPending}
          >
            Create agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

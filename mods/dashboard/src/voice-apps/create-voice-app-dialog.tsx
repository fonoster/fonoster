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
import { AudioLines, Info, ListTree, PhoneIncoming } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "~/components/ui/dialog";
import { Field } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { errorMessage } from "~/lib/errors";
import { cn } from "~/lib/utils";
import { CodeBlock, CopyButton } from "./code-block";
import { voiceAppSchema, type VoiceAppValues } from "./schema";
import { DEFAULT_SPEECH, speechPayload, voiceKey } from "./speech";
import { SpeechFields } from "./speech-fields";
import {
  RUN_LOCALLY,
  TEMPLATES,
  templateCode,
  type TemplateId
} from "./templates";
import { EXTERNAL, useCreateVoiceApp } from "./voice-apps.service";

const TEMPLATE_ICONS = {
  ivr: ListTree,
  stream: AudioLines,
  blank: PhoneIncoming
};

/** IVR menus speak and listen; streams and blank apps start without speech. */
function speechFor(template: TemplateId): VoiceAppValues["speech"] {
  return template === "ivr"
    ? {
        voice: voiceKey("tts.deepgram", "aura-2-thalia-en"),
        transcriber: "nova-3",
        language: "en-US"
      }
    : DEFAULT_SPEECH;
}

const initialValues = (): VoiceAppValues => ({
  name: "",
  endpoint: "",
  speech: speechFor("ivr")
});

/** "New voice app": name, endpoint, optional speech, with starter code. */
export function CreateVoiceAppDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateVoiceApp();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<TemplateId>("ivr");
  const form = useForm<VoiceAppValues>({
    resolver: zodResolver(voiceAppSchema),
    defaultValues: initialValues()
  });
  const { errors } = form.formState;
  const transcriber = form.watch("speech.transcriber");

  useEffect(() => {
    if (!open) return;
    setTemplate("ivr");
    form.reset(initialValues());
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (id: TemplateId) => {
    setTemplate(id);
    form.setValue("speech", speechFor(id));
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const { ref } = await create.mutateAsync({
        name: values.name,
        type: EXTERNAL,
        endpoint: values.endpoint,
        ...speechPayload(values.speech)
      });
      onOpenChange(false);
      navigate(ref);
    } catch {
      // Shown from create.error.
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto p-0 sm:max-w-[960px]">
        <DialogHeader className="border-b border-border px-6 py-5">
          <DialogTitle>New voice app</DialogTitle>
          <DialogDescription>
            Point Fonoster at your voice server. It runs your code on every
            call.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_380px]">
          <form
            id="voice-app-form"
            onSubmit={onSubmit}
            noValidate
            className="flex min-w-0 flex-col gap-5"
          >
            {create.error && (
              <Alert variant="error">{errorMessage(create.error)}</Alert>
            )}
            <div className="flex flex-col gap-2">
              <span
                id="voice-app-start"
                className="font-display text-xs text-muted-foreground"
              >
                Start from
              </span>
              <div
                role="radiogroup"
                aria-labelledby="voice-app-start"
                className="grid gap-2.5 sm:grid-cols-3"
              >
                {TEMPLATES.map((t) => {
                  const Icon = TEMPLATE_ICONS[t.id];
                  const checked = template === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={checked}
                      onClick={() => pick(t.id)}
                      className={cn(
                        "flex cursor-pointer flex-col gap-1.5 rounded-xl border bg-card p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                        checked
                          ? "border-primary"
                          : "border-border hover:bg-muted/60"
                      )}
                    >
                      <Icon
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="font-display text-[13px] font-medium">
                        {t.title}
                      </span>
                      <span className="font-display text-xs text-muted-foreground">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Name" error={errors.name?.message}>
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("name")}
                  placeholder="Main menu IVR"
                  autoComplete="off"
                />
              )}
            </Field>
            <Field
              label="Endpoint"
              error={errors.endpoint?.message}
              action={
                <span className="text-[11px] text-muted-foreground">
                  host:port of your voice server
                </span>
              }
            >
              {(a11y) => (
                <Input
                  {...a11y}
                  {...form.register("endpoint")}
                  placeholder="voice.acme.com:50061"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                />
              )}
            </Field>
            <div className="flex flex-col gap-2">
              <SpeechFields
                control={form.control}
                errors={errors}
                transcriber={transcriber}
              />
              <p className="text-[11px] text-muted-foreground">
                Used by say() and gather(). Not needed for audio streams.
              </p>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
              <Info
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <p className="font-display text-xs text-muted-foreground">
                To receive calls, point a number at this app from Numbers after
                you create it.
              </p>
            </div>
          </form>
          <div className="flex min-w-0 flex-col gap-3">
            <CodeBlock
              title="index.js"
              code={templateCode(template)}
              className="flex-1"
            />
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-xs text-muted-foreground">
                Run it locally and expose it:
              </span>
              <div className="flex items-center justify-between gap-2 rounded-control border border-border bg-muted/40 px-3 py-2">
                <code className="truncate font-mono text-xs">
                  {RUN_LOCALLY}
                </code>
                <CopyButton value={RUN_LOCALLY} label="Copy run command" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2.5 border-t border-border px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="voice-app-form"
            loading={create.isPending}
          >
            Create voice app
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

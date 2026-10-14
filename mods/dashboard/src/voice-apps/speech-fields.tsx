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
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { Field } from "~/components/ui/field";
import { Select } from "~/components/ui/select";
import type { VoiceAppValues } from "./schema";
import {
  NONE,
  languageOptions,
  transcriberOptions,
  voiceOptions
} from "./speech";

/** Voice, transcriber and language selects for a voice app form. */
export function SpeechFields({
  control,
  errors,
  transcriber
}: {
  control: Control<VoiceAppValues>;
  errors: FieldErrors<VoiceAppValues>;
  /** The current transcriber, to enable the language. */
  transcriber: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field label="Voice" error={errors.speech?.voice?.message}>
        {(a11y) => (
          <Controller
            control={control}
            name="speech.voice"
            render={({ field }) => (
              <Select
                {...a11y}
                value={field.value}
                onValueChange={field.onChange}
                options={voiceOptions(field.value)}
              />
            )}
          />
        )}
      </Field>
      <Field label="Transcriber" error={errors.speech?.transcriber?.message}>
        {(a11y) => (
          <Controller
            control={control}
            name="speech.transcriber"
            render={({ field }) => (
              <Select
                {...a11y}
                value={field.value}
                onValueChange={field.onChange}
                options={transcriberOptions(field.value)}
              />
            )}
          />
        )}
      </Field>
      <Field label="Language" error={errors.speech?.language?.message}>
        {(a11y) => (
          <Controller
            control={control}
            name="speech.language"
            render={({ field }) => (
              <Select
                {...a11y}
                value={field.value}
                onValueChange={field.onChange}
                options={languageOptions(field.value)}
                disabled={transcriber === NONE}
              />
            )}
          />
        )}
      </Field>
    </div>
  );
}

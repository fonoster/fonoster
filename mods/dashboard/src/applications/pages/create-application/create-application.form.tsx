/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with the
 * License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useForm, type Resolver } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";
import { Form } from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { useFormContextSync } from "~/core/hooks/use-form-context-sync";
import {
  APPLICATIONS_DEFAULT_INITIAL_VALUES,
  TTS_DEEPGRAM_VOICES,
  TTS_ELEVENLABS_VOICES
} from "./create-application.const";
import {
  type Form as FormType,
  type Schema,
  resolver
} from "./schemas/application-schema";
import { GeneralSection } from "./sections/general-section";
import { SpeechSection } from "./sections/speech-section";
import { AdvancedSettingsSection } from "./sections/advanced-settings-section";
import { ConversationSettingsSection } from "./sections/conversation-settings-section";

export interface CreateApplicationFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema, form: FormType) => Promise<void>;
  isEdit?: boolean;
}

export const CreateApplicationForm = ({
  onSubmit,
  initialValues,
  isEdit
}: CreateApplicationFormProps) => {
  const form = useForm<Schema>({
    resolver: resolver as Resolver<Schema>,
    defaultValues: { ...APPLICATIONS_DEFAULT_INITIAL_VALUES, ...initialValues },
    mode: "onChange"
  });

  const onFormSubmit = useCallback(
    (data: Schema) => {
      onSubmit(data, form);
    },
    [onSubmit, form]
  );

  // Sync form state with context
  useFormContextSync(form, onFormSubmit, isEdit);

  const type = form.watch("type");
  const ttsVendor = form.watch("textToSpeech.productRef");
  const ttsVoice = form.watch("textToSpeech.config.voice");
  const languageModelProvider = form.watch(
    "intelligence.config.languageModel.provider"
  );
  const isAutopilot = type === "AUTOPILOT";

  // Keep track of previous vendor to detect vendor changes
  const [prevTtsVendor, setPrevTtsVendor] = useState<string | undefined>(ttsVendor);

  useEffect(() => {
    // Only reset voice when vendor changes, not when voice changes
    if (ttsVendor && ttsVendor !== prevTtsVendor) {
      // Check if current voice is a custom voice (not in predefined lists)
      const isCustomVoice = (voiceValue: string): boolean => {
        if (!voiceValue) return false;
        
        const allPredefinedVoices = [
          ...TTS_DEEPGRAM_VOICES.map(v => v.value),
          ...TTS_ELEVENLABS_VOICES.map(v => v.value)
        ];
        
        return !allPredefinedVoices.includes(voiceValue);
      };

      // Only reset voice if it's not a custom voice
      if (!ttsVoice || !isCustomVoice(ttsVoice)) {
        if (ttsVendor === "tts.deepgram") {
          const { value: firstVoice } = TTS_DEEPGRAM_VOICES[0];
          form.setValue("textToSpeech.config.voice", firstVoice);
        }

        if (ttsVendor === "tts.elevenlabs") {
          const { value: firstVoice } = TTS_ELEVENLABS_VOICES[0];
          form.setValue("textToSpeech.config.voice", firstVoice);
        }
      }

      // Update the previous vendor
      setPrevTtsVendor(ttsVendor);
    }
  }, [ttsVendor, ttsVoice, form, prevTtsVendor]);

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onFormSubmit)}>
        <GeneralSection
          control={form.control}
          isAutopilot={isAutopilot}
          isEdit={isEdit}
        />
        {isAutopilot && (
          <ConversationSettingsSection
            control={form.control}
            isAutopilot={isAutopilot}
          />
        )}
        <SpeechSection
          control={form.control}
          isAutopilot={isAutopilot}
          ttsVendor={ttsVendor}
        />
        {isAutopilot && (
          <AdvancedSettingsSection
            control={form.control}
            languageModelProvider={languageModelProvider}
          />
        )}
      </FormRoot>
    </Form>
  );
};

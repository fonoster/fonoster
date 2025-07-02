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

import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import {
  FormField,
  FormControl,
  FormItem
} from "~/core/components/design-system/forms";
import { Select } from "~/core/components/design-system/ui/select/select";
import {
  STT_MODELS,
  LANGUAGES,
  STT_VENDORS,
  TTS_DEEPGRAM_VOICES,
  TTS_ELEVENLABS_VOICES,
  TTS_VENDORS
} from "../create-application.const";
import type { Control } from "react-hook-form";
import type { Schema } from "../schemas/application-schema";

export const SpeechSection = ({
  control,
  isAutopilot,
  ttsVendor
}: {
  control: Control<Schema>;
  isAutopilot: boolean;
  ttsVendor?: string;
}) => {
  return (
    <>
      <Box sx={{ mt: "8px" }}>
        <Typography variant="mono-medium" color="base.03">
          SPEECH TO TEXT
        </Typography>
        <Typography variant="body-micro" color="base.03">
          Select the Speech-to-Text vendor and model that best fit your use
          case. Check the vendor's documentation for the languages supported by
          each model.
        </Typography>
      </Box>

      <FormField
        control={control}
        name="speechToText.productRef"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select label="Vendor" options={STT_VENDORS} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="speechToText.config.languageCode"
        rules={isAutopilot ? { required: true } : {}}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select label="Language" options={LANGUAGES} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="speechToText.config.model"
        rules={isAutopilot ? { required: true } : {}}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select label="Model" options={STT_MODELS} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <Box sx={{ mt: "8px" }}>
        <Typography variant="mono-medium" color="base.03">
          TEXT TO SPEECH
        </Typography>
        <Typography variant="body-micro" color="base.03">
          Select the Text-to-Speech vendor and voice that best fit your use
          case. Check the vendor's documentation for the languages supported by
          each voice.
        </Typography>
      </Box>

      <FormField
        control={control}
        name="textToSpeech.productRef"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select label="Vendor" options={TTS_VENDORS} {...field} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="textToSpeech.config.voice"
        rules={isAutopilot ? { required: true } : {}}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select
                label="Voice"
                options={
                  ttsVendor === "tts.deepgram"
                    ? TTS_DEEPGRAM_VOICES
                    : TTS_ELEVENLABS_VOICES
                }
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};

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
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from "~/core/components/design-system/forms";
import { Input } from "~/core/components/design-system/ui/input/input";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCallback } from "react";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { Select } from "~/core/components/design-system/ui/select/select";
import { ApplicationType } from "@fonoster/types";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Box } from "@mui/material";

const APPLICATION_TYPES = [
  { value: ApplicationType.EXTERNAL, label: "External" },
  { value: ApplicationType.AUTOPILOT, label: "Autopilot" }
];

const TTS_VENDORS = [{ value: "deepgram", label: "Deepgram" }];

const TTS_VOICES = [{ value: "aura_asteria_en", label: "Aura Asteria (en)" }];

const STT_VENDORS = [{ value: "deepgram", label: "Deepgram" }];

const STT_MODELS = [{ value: "nova-2", label: "Nova 2" }];

const LANGUAGES = [{ value: "en-US", label: "en-US" }];

export const schema = z.object({
  ref: z.string().nullish(),
  name: z.string(),
  type: z.string(),
  endpoint: z.string().optional(),
  textToSpeech: z.object({
    vendor: z.string(),
    voice: z.string()
  }),
  speechToText: z.object({
    vendor: z.string(),
    model: z.string(),
    language: z.string()
  })
});

export const resolver = zodResolver(schema);

export type Schema = z.infer<typeof schema>;

export interface CreateApplicationFormProps extends React.PropsWithChildren {}

export function CreateApplicationForm() {
  const form = useForm<Schema>({
    resolver,
    defaultValues: {
      ref: "",
      name: "",
      type: "",
      endpoint: "",
      textToSpeech: {
        vendor: "",
        voice: ""
      },
      speechToText: {
        vendor: "",
        model: ""
      }
    },
    mode: "onChange"
  });

  const onSubmit = useCallback(
    async (data: Schema) => {
      console.log("Form submitted", data);
      toast("Ahoy! Invite sent successfully");
    },
    [form]
  );

  const { isValid, isSubmitting } = form.formState;

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <Typography variant="mono-medium" color="base.03">
          GENERAL
        </Typography>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Friendly Name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select
                  label="Application Type"
                  options={APPLICATION_TYPES}
                  {...field}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="text" label="Application Endpoint" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Box sx={{ mt: "8px" }}>
          <Typography variant="mono-medium" color="base.03">
            TEXT TO SPEECH
          </Typography>
          <Typography variant="body-micro" color="base.03">
            This section allows you to configure the transcription settings for
            the assistant.
          </Typography>
        </Box>

        <FormField
          control={form.control}
          name="textToSpeech.vendor"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Vendor" options={TTS_VENDORS} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="textToSpeech.voice"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Voice" options={TTS_VOICES} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <Box sx={{ mt: "8px" }}>
          <Typography variant="mono-medium" color="base.03">
            SPEECH TO TEXT
          </Typography>
          <Typography variant="body-micro" color="base.03">
            Choose from the list of voices, or sync your voice library if you
            aren't able to find your voice in the dropdown. If you are still
            facing any error, you can enable custom voice and add a voice ID
            manually.
          </Typography>
        </Box>

        <FormField
          control={form.control}
          name="speechToText.vendor"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Vendor" options={STT_VENDORS} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="speechToText.model"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Model" options={STT_MODELS} {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="speechToText.language"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Select label="Language" options={LANGUAGES} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </FormRoot>
    </Form>
  );
}

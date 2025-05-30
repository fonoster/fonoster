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
import { Select } from "~/core/components/design-system/ui/select/select";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Box } from "@mui/material";
import {
  APPLICATION_TYPES,
  APPLICATIONS_DEFAULT_INITIAL_VALUES,
  LANGUAGES,
  STT_MODELS,
  STT_VENDORS,
  TTS_VENDORS,
  TTS_VOICES
} from "./create-application.const";
import { forwardRef, useImperativeHandle } from "react";
import { ApplicationType } from "@fonoster/types";

/**
 * Zod validation schema for the Create Application form.
 * Ensures all fields meet expected structure and type.
 */
export const schema = z.object({
  ref: z.string().nullish(),
  name: z.string(),
  type: z.nativeEnum(ApplicationType),
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

/** Resolver to integrate Zod schema validation with React Hook Form. */
export const resolver = zodResolver(schema);

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;

/**
 * Imperative handle interface exposing a submit method.
 * Allows parent components to trigger form submission programmatically.
 */
export interface CreateApplicationFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

/**
 * Props interface for the CreateApplicationForm component.
 */
export interface CreateApplicationFormProps extends React.PropsWithChildren {
  /** Optional initial values to populate the form with. */
  initialValues?: Schema;
  /** Callback triggered on successful form submission. */
  onSubmit: (data: Schema) => Promise<void>;
}

/**
 * CreateApplicationForm component.
 * Renders a form with sections for:
 *  - General Information
 *  - Text to Speech (TTS)
 *  - Speech to Text (STT)
 *
 * Integrates:
 *  - React Hook Form for form management.
 *  - Zod for validation.
 *  - Imperative handle to expose a `submit` method to parent components.
 */
export const CreateApplicationForm = forwardRef<
  CreateApplicationFormHandle,
  CreateApplicationFormProps
>(({ onSubmit, initialValues }, ref) => {
  /** Initializes the React Hook Form with schema validation and initial values. */
  const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: initialValues || APPLICATIONS_DEFAULT_INITIAL_VALUES,
    mode: "onChange"
  });

  /** Exposes the submit method via imperative handle. */
  useImperativeHandle(ref, () => ({
    submit: () => {
      form.handleSubmit(onSubmit)();
    },
    isSubmitDisabled: form.formState.isSubmitting || !form.formState.isValid
  }));

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        {/* General Section */}
        <Typography variant="mono-medium" color="base.03">
          GENERAL
        </Typography>

        {/* Friendly Name Field */}
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

        {/* Application Type Field */}
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

        {/* Application Endpoint Field */}
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

        {/* Text to Speech Section */}
        <Box sx={{ mt: "8px" }}>
          <Typography variant="mono-medium" color="base.03">
            TEXT TO SPEECH
          </Typography>
          <Typography variant="body-micro" color="base.03">
            This section allows you to configure the text-to-speech settings.
          </Typography>
        </Box>

        {/* TTS Vendor */}
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

        {/* TTS Voice */}
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

        {/* Speech to Text Section */}
        <Box sx={{ mt: "8px" }}>
          <Typography variant="mono-medium" color="base.03">
            SPEECH TO TEXT
          </Typography>
          <Typography variant="body-micro" color="base.03">
            Choose from the list of models, vendors, and languages.
          </Typography>
        </Box>

        {/* STT Vendor */}
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

        {/* STT Model */}
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

        {/* STT Language */}
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
});

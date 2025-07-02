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

import { useForm, type Resolver } from "react-hook-form";
import { forwardRef, useCallback, useEffect, useImperativeHandle } from "react";
import { Form } from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { APPLICATIONS_DEFAULT_INITIAL_VALUES } from "./create-application.const";
import {
  type Form as FormType,
  type Schema,
  resolver
} from "./schemas/application-schema";
import { GeneralSection } from "./sections/general-section";
import { SpeechSection } from "./sections/speech-section";
import { AdvancedSettingsSection } from "./sections/advanced-settings-section";
import { ConversationSettingsSection } from "./sections/conversation-settings-section";
import { Logger } from "~/core/shared/logger";

export interface CreateApplicationFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

export interface CreateApplicationFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema, form: FormType) => Promise<void>;
  isEdit?: boolean;
}

export const CreateApplicationForm = forwardRef<
  CreateApplicationFormHandle,
  CreateApplicationFormProps
>(({ onSubmit, initialValues, isEdit }, ref) => {
  const form = useForm<Schema>({
    resolver: resolver as Resolver<Schema>,
    defaultValues: { ...APPLICATIONS_DEFAULT_INITIAL_VALUES, ...initialValues },
    mode: "onChange"
  });

  const onFormSubmit = useCallback(
    (data: Schema) => {
      onSubmit(data, form);
    },
    [onSubmit]
  );

  const type = form.watch("type");
  const ttsVendor = form.watch("textToSpeech.productRef");
  const languageModelProvider = form.watch(
    "intelligence.config.languageModel.provider"
  );
  const isAutopilot = type === "AUTOPILOT";

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onFormSubmit)(),
    isSubmitDisabled: !form.formState.isValid || form.formState.isSubmitting
  }));

  useEffect(() => {
    Logger.debug("[CreateApplicationForm] Form initialized", {
      defaultValues: {
        ...APPLICATIONS_DEFAULT_INITIAL_VALUES,
        ...initialValues
      }
    });
  }, [initialValues]);

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
});

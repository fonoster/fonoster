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
    submit: () => form.handleSubmit(onFormSubmit)()
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

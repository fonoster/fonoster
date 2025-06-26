import { useForm, type Resolver } from "react-hook-form";
import { forwardRef, useImperativeHandle } from "react";
import { Form } from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { APPLICATIONS_DEFAULT_INITIAL_VALUES } from "./create-application.const";
import { type Schema, resolver } from "./schemas/application-schema";
import { GeneralSection } from "./sections/general-section";
import { SpeechSection } from "./sections/speech-section";
import { AdvancedSettingsSection } from "./sections/advanced-settings-section";
import { ConversationSettingsSection } from "./sections/conversation-settings-section";

export interface CreateApplicationFormHandle {
  submit: () => void;
  isSubmitDisabled?: boolean;
}

export interface CreateApplicationFormProps extends React.PropsWithChildren {
  initialValues?: Schema;
  onSubmit: (data: Schema) => Promise<void>;
}

export const CreateApplicationForm = forwardRef<
  CreateApplicationFormHandle,
  CreateApplicationFormProps
>(({ onSubmit, initialValues }, ref) => {
  const form = useForm<Schema>({
    resolver: resolver as Resolver<Schema>,
    defaultValues: { ...APPLICATIONS_DEFAULT_INITIAL_VALUES, ...initialValues },
    mode: "onChange"
  });

  useImperativeHandle(ref, () => ({
    submit: () => form.handleSubmit(onSubmit)(),
    isSubmitDisabled: form.formState.isSubmitting || !form.formState.isValid
  }));

  const type = form.watch("type");
  const ttsVendor = form.watch("textToSpeech.productRef");
  const languageModelProvider = form.watch(
    "intelligence.config.languageModel.provider"
  );
  const isAutopilot = type === "AUTOPILOT";

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GeneralSection control={form.control} isAutopilot={isAutopilot} />
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

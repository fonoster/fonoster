import { useForm, type Resolver } from "react-hook-form";
import { forwardRef, useImperativeHandle } from "react";
import { Form } from "~/core/components/design-system/forms";
import { FormRoot } from "~/core/components/design-system/forms/form-root";
import { APPLICATIONS_DEFAULT_INITIAL_VALUES } from "./create-application.const";
import { type Schema, resolver } from "./schemas/application-schema";
import { GeneralSection } from "./sections/general-section";
import { TTSSection } from "./sections/tts-section";
import { STTSection } from "./sections/stt-section";
import { IntelligenceSection } from "./sections/intelligence-section";

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
  const isAutopilot = type === "AUTOPILOT";

  return (
    <Form {...form}>
      <FormRoot onSubmit={form.handleSubmit(onSubmit)}>
        <GeneralSection control={form.control} isAutopilot={isAutopilot} />
        <TTSSection control={form.control} isAutopilot={isAutopilot} />
        <STTSection control={form.control} isAutopilot={isAutopilot} />
        {isAutopilot && <IntelligenceSection control={form.control} />}
      </FormRoot>
    </Form>
  );
});

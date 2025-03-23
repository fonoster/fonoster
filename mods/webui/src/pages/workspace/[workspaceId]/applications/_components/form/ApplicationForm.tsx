import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InputContext } from "@/common/hooksForm/InputContext";
import { SelectContext } from "@/common/hooksForm/SelectContext";
import { ApplicationType } from "@fonoster/types";
import PageContainer from "@/common/components/layout/pages";
import { useRouter } from "next/router";
import { Button } from "@stories/button/Button";
import { Box, Grid } from "@mui/material";
import { Typography } from "@stories/typography/Typography";
import { useApplications } from "@/common/sdk/hooks/useApplications";
import { ErrorType, useNotification } from "@/common/hooks/useNotification";
import {
  applicationSchema,
  ApplicationFormSchema,
  transformToApiFormat
} from "./applicationSchema";
import ApplicationFormSkeleton from "./ApplicationFormSkeleton";

const { ContentForm } = PageContainer;

const DESCRIPTION_MAX_WIDTH = "510px";
const SECTION_HEADER_STYLES = { textTransform: "uppercase" as const };
const DESCRIPTION_STYLES = { mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH };

export interface ApplicationFormData {
  ref?: string | null;
  name: string;
  description?: string;
  type: ApplicationType;
  endpoint?: string;
  textToSpeech?: {
    vendor: string;
    voice: string;
  };
  speechToText?: {
    vendor: string;
    model: string;
    language: string;
  };
}

interface ApplicationFormProps {
  initialValues?: ApplicationFormData | null;
  isLoading?: boolean;
  formId?: string;
}

const applicationTypes = [
  { value: ApplicationType.EXTERNAL, label: "External" },
  { value: ApplicationType.AUTOPILOT, label: "Autopilot" }
];

const ttsVendors = [{ value: "deepgram", label: "Deepgram" }];

const ttsVoices = [{ value: "aura_asteria_en", label: "Aura Asteria (en)" }];

const sttVendors = [{ value: "deepgram", label: "Deepgram" }];

const sttModels = [{ value: "nova-2", label: "Nova 2" }];

const languages = [{ value: "en-US", label: "en-US" }];

export default function ApplicationForm({
  initialValues,
  isLoading = false,
  formId = "application-form"
}: ApplicationFormProps) {
  const router = useRouter();
  const { workspaceId } = router.query;
  const { createApplication, updateApplication } = useApplications();
  const { notifySuccess, notifyError, NotificationComponent } =
    useNotification();
  const isUpdate = !!initialValues?.ref;

  const defaultInitialValues: ApplicationFormSchema = {
    ref: null,
    name: "",
    type: ApplicationType.EXTERNAL,
    endpoint: "",
    textToSpeech: {
      vendor: "deepgram",
      voice: "aura_asteria_en"
    },
    speechToText: {
      vendor: "deepgram",
      model: "nova-2",
      language: "en-US"
    }
  };

  const methods = useForm<ApplicationFormSchema>({
    defaultValues: initialValues || defaultInitialValues,
    resolver: zodResolver(applicationSchema),
    mode: "onChange"
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
    setValue
  } = methods;

  const onSubmit = async (data: ApplicationFormSchema) => {
    try {
      const apiData = transformToApiFormat(data);

      if (data.ref) {
        await updateApplication(apiData as any);
      } else {
        const response = await createApplication(apiData as any);
        setValue("ref", response?.ref);
      }
      notifySuccess(
        `Application ${isUpdate ? "updated" : "created"} successfully`
      );
      router.push(`/workspace/${workspaceId}/applications`);
    } catch (error) {
      notifyError(error as ErrorType);
    }
  };

  const handleTestCall = () => {
    console.log("Test call");
  };

  if (isLoading) {
    return <ApplicationFormSkeleton />;
  }

  return (
    <PageContainer>
      <NotificationComponent />
      <PageContainer.Header
        title={isUpdate ? "Edit Application" : "Create New Application"}
        backTo={{
          label: "Back to voice applications",
          onClick: () => router.push(`/workspace/${workspaceId}/applications`)
        }}
        actions={
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              disabled={isLoading}
              onClick={handleTestCall}
            >
              TEST CALL
            </Button>
            <Button
              variant="contained"
              disabled={isLoading || !isValid}
              onClick={handleSubmit(onSubmit)}
            >
              SAVE VOICE APPLICATION
            </Button>
          </Box>
        }
      />

      <Box sx={{ mb: 4, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Typography variant="body-small">
          Create a programmable voice application to connect your Telephony
          infrastructure with your Dialogflow Agents
        </Typography>
      </Box>

      <ContentForm methods={methods} formId={formId}>
        <Typography variant="mono-medium" sx={SECTION_HEADER_STYLES}>
          GENERAL
        </Typography>

        <InputContext
          name="name"
          label="Friendly Name*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-name`}
        />

        <SelectContext
          name="type"
          label="Application Type"
          options={applicationTypes}
          id={`${formId}-type`}
        />

        <InputContext
          name="endpoint"
          label="Application Endpoint*"
          type="text"
          leadingIcon={null}
          trailingIcon={null}
          id={`${formId}-endpoint`}
        />
        <Typography variant="mono-medium" sx={SECTION_HEADER_STYLES}>
          TEXT TO SPEECH
        </Typography>
        <Typography variant="body-micro" sx={DESCRIPTION_STYLES}>
          This section allows you to configure the transcription settings for
          the assistant.
        </Typography>

        <SelectContext
          name="textToSpeech.vendor"
          label="Vendor*"
          options={ttsVendors}
          id={`${formId}-tts-vendor`}
        />

        <SelectContext
          name="textToSpeech.voice"
          label="Voice*"
          options={ttsVoices}
          id={`${formId}-tts-voice`}
        />

        <Typography variant="mono-medium" sx={SECTION_HEADER_STYLES}>
          SPEECH TO TEXT
        </Typography>

        <Typography variant="body-micro" sx={DESCRIPTION_STYLES}>
          Choose from the list of voices or sync your voice library. If you
          aren't able to find your voice in the dropdown, if you are still
          facing any error, you can enable custom voice and add a voice ID
          manually.
        </Typography>

        <SelectContext
          name="speechToText.vendor"
          label="Vendor*"
          options={sttVendors}
          id={`${formId}-stt-vendor`}
        />

        <SelectContext
          name="speechToText.model"
          label="Model*"
          options={sttModels}
          id={`${formId}-stt-model`}
        />

        <SelectContext
          name="speechToText.language"
          label="Language*"
          options={languages}
          id={`${formId}-stt-language`}
        />
      </ContentForm>
    </PageContainer>
  );
}

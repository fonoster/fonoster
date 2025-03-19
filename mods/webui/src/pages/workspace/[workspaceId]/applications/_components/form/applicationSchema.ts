import { z } from "zod";
import { ApplicationType } from "@fonoster/types";
const formSchema = z
  .object({
    ref: z.string().nullable().optional(),
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.nativeEnum(ApplicationType, {
      errorMap: () => ({ message: "Invalid application type" })
    }),
    endpoint: z
      .string()
      .min(1, "Endpoint is required")
      .url("Must be a valid URL"),
    textToSpeech: z.object({
      vendor: z.string().min(1, "Vendor is required"),
      voice: z.string().min(1, "Voice is required")
    }),
    speechToText: z.object({
      vendor: z.string().min(1, "Vendor is required"),
      model: z.string().min(1, "Model is required"),
      language: z.string().min(1, "Language is required")
    })
  })
  .refine(
    (data) => {
      if (data.type === ApplicationType.EXTERNAL) {
        return !!data.endpoint;
      }
      return true;
    },
    {
      message: "Endpoint is required for EXTERNAL application type",
      path: ["endpoint"]
    }
  );

export const applicationSchema = formSchema;

export type ApplicationFormSchema = z.infer<typeof formSchema>;

export function transformToApiFormat(formData: ApplicationFormSchema) {
  return {
    ...formData,
    textToSpeech: formData.textToSpeech
      ? {
          productRef: formData.textToSpeech.vendor,
          config: {
            voice: formData.textToSpeech.voice
          }
        }
      : undefined,
    speechToText: formData.speechToText
      ? {
          productRef: formData.speechToText.vendor,
          config: {
            model: formData.speechToText.model,
            language: formData.speechToText.language
          }
        }
      : undefined
  };
}

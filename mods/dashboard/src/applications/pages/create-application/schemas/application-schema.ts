import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationType } from "@fonoster/types";
import { conversationSettingsSchema } from "./conversation-settings-schema";
import { languageModelConfigSchema } from "./language-model-config-schema";
import { eventsHookSchema } from "./events-hook-schema";
import type { UseFormReturn } from "react-hook-form";

export const schema = z
  .object({
    ref: z.string().nullish(),
    name: z.string().nonempty(),
    type: z.nativeEnum(ApplicationType),
    endpoint: z.string().optional(),
    textToSpeech: z
      .object({
        productRef: z.string(),
        config: z.object({
          voice: z.string().optional()
        })
      })
      .optional(),
    speechToText: z
      .object({
        productRef: z.string(),
        config: z.object({
          model: z.string().optional(),
          languageCode: z.string().optional()
        })
      })
      .optional(),
    intelligence: z
      .object({
        productRef: z.string(),
        config: z.object({
          conversationSettings: conversationSettingsSchema,
          languageModel: languageModelConfigSchema,
          eventsHook: eventsHookSchema
        })
      })
      .optional()
  })
  // For AUTOPILOT applications, textToSpeech and speechToText are required
  .refine(
    (data) =>
      !(
        data.type === ApplicationType.AUTOPILOT &&
        (!data.textToSpeech || !data.speechToText)
      ),
    {
      message: "TTS and STT are required for AUTOPILOT"
    }
  );

/** Resolver to integrate Zod schema validation with React Hook Form. */
export const resolver = zodResolver(schema);

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;
export type Form = UseFormReturn<Schema>;

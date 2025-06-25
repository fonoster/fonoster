import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApplicationType } from "@fonoster/types";
import { conversationSettingsSchema } from "./conversation-settings-schema";
import { languageModelConfigSchema } from "./language-model-config-schema";
import { eventsHookSchema } from "./events-hook-schema";

export const schema = z
  .object({
    ref: z.string().nullish(),
    name: z.string().nonempty(),
    type: z.nativeEnum(ApplicationType),
    endpoint: z.string().optional(),
    textToSpeech: z
      .object({
        productRef: z.string().optional(),
        config: z.object({
          voice: z.string().optional(),
        }),
      })
      .optional(),
    speechToText: z
      .object({
        productRef: z.string().optional(),
        config: z.object({
          model: z.string().optional(),
          languageCode: z.string().optional(),
        }),
      })
      .optional(),
    intelligence: z
      .object({
        productRef: z.string().optional(),
        config: z.object({
          conversationSettings: conversationSettingsSchema,
          languageModel: languageModelConfigSchema,
          eventsHook: eventsHookSchema,
        }),
      })
      .optional(),
  })
  .refine(
    (data) => !(data.type === ApplicationType.EXTERNAL && data.textToSpeech),
    {
      message: "TTS is not allowed for EXTERNAL applications",
      path: ["textToSpeech"],
    }
  )
  .refine(
    (data) => !(data.type === ApplicationType.EXTERNAL && data.speechToText),
    {
      message: "STT is not allowed for EXTERNAL applications",
      path: ["speechToText"],
    }
  )
  .refine(
    (data) => !(data.type === ApplicationType.EXTERNAL && data.intelligence),
    {
      message: "Intelligence is not allowed for EXTERNAL applications",
      path: ["intelligence"],
    }
  );

/** Resolver to integrate Zod schema validation with React Hook Form. */
export const resolver = zodResolver(schema);

/** Type representing the validated data structure. */
export type Schema = z.infer<typeof schema>;

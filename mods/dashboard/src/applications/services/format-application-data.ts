import {
  ApplicationType,
  type CreateApplicationRequest
} from "@fonoster/types";
import type {
  Form,
  Schema
} from "../pages/create-application/schemas/application-schema";
import { Logger } from "~/core/shared/logger";

export function formatApplicationData({ intelligence, ...data }: Schema) {
  if (data.type === ApplicationType.EXTERNAL && !data.endpoint) {
    throw new Error("Endpoint is required for EXTERNAL applications");
  }

  if (data.type === ApplicationType.AUTOPILOT) {
    if (!data.textToSpeech) {
      throw new Error("Text-to-Speech is required for AUTOPILOT applications");
    }

    if (!data.speechToText) {
      throw new Error("Speech-to-Text is required for AUTOPILOT applications");
    }
  }

  const application = {
    ...data
  } as CreateApplicationRequest;

  if (data.type === ApplicationType.AUTOPILOT && intelligence) {
    application.intelligence = {
      ...intelligence,
      productRef: `llm.${intelligence.config.languageModel.provider}`,
      credentials: {}
    };

    if (!application.intelligence.productRef) {
      throw new Error(
        "Product reference is required for AUTOPILOT applications"
      );
    }

    if (!application.intelligence.config) {
      throw new Error("Configuration is required for AUTOPILOT applications");
    }

    if (!intelligence.config.eventsHook?.url) {
      delete application.intelligence.config.eventsHook;
    }
  }

  Logger.debug("Formatted application data for submission", application);

  return application;
}

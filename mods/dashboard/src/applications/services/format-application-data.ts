import {
  ApplicationType,
  type CreateApplicationRequest
} from "@fonoster/types";
import type {
  Form,
  Schema
} from "../pages/create-application/schemas/application-schema";
import { Logger } from "~/core/shared/logger";

export function formatApplicationData(
  { intelligence, ...data }: Schema,
  form: Form
) {
  if (data.type === ApplicationType.EXTERNAL && !data.endpoint) {
    form.setError("endpoint", {
      type: "required",
      message: "Endpoint is required for EXTERNAL applications"
    });
    return;
  }

  if (data.type === ApplicationType.AUTOPILOT) {
    if (!data.textToSpeech) {
      form.setError("textToSpeech.productRef", {
        type: "required",
        message: "Text-to-Speech is required for AUTOPILOT applications"
      });
      return;
    }

    if (!data.speechToText) {
      form.setError("speechToText.productRef", {
        type: "required",
        message: "Speech-to-Text is required for AUTOPILOT applications"
      });
      return;
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
      form.setError("intelligence.config.languageModel.provider", {
        type: "required",
        message:
          "Language model provider is required for AUTOPILOT applications"
      });
      return;
    }

    if (!intelligence.config.eventsHook?.url) {
      if ((intelligence.config.eventsHook?.events?.length || 0) > 0) {
        form.setError("intelligence.config.eventsHook.url", {
          type: "required",
          message: "Events hook URL is required when events are specified"
        });
        return;
      }

      delete application.intelligence.config.eventsHook;
    } else {
      if (
        !intelligence.config.eventsHook.events ||
        intelligence.config.eventsHook.events.length === 0
      ) {
        form.setError("intelligence.config.eventsHook.events", {
          type: "required",
          message: "Events are required when URL is provided"
        });
        return;
      }
    }
  }

  Logger.debug(
    "[Applications]: Formatted application data for submission",
    application
  );

  return application;
}

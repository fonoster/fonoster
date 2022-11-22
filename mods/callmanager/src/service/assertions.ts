import { FonosterInvalidArgument } from "@fonoster/errors";
import phone from "phone";
import { CallManagerPB } from "../client/callmanager";

export const assertCompatibleParameters = (
  request: CallManagerPB.CallRequest
) => {
  if (request.getWebhook() && request.getAppRef()) {
    throw new FonosterInvalidArgument(
      "webhook and appRef cannot be used together"
    );
  }
};

const isValidURL = (value: string) =>
  /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(value);

export const assertIsE164 = (number: string, field: string) => {
  if (phone(number).length === 0) {
    throw new FonosterInvalidArgument(
      `field "${field}" must be a valid e164 value.`
    );
  }
};

export const assertWebhookIsURL = (webhook: string) => {
  if (webhook && !isValidURL(webhook)) {
    throw new FonosterInvalidArgument("webhook field must be a valid URL.");
  }
};

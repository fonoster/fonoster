import { FonosterInvalidArgument } from "@fonoster/errors";
import { NumbersPB } from "../client/numbers";
import { IngressInfo } from "./protos/numbers_pb";

const isValidURL = (value: string) =>
  /^(?:\w+:)?\/\/([^\s\.]+\.\S{2}|localhost[\:?\d]*)\S*$/.test(value);

export const assertIsE164 = (number: string) => {
  if (!number) {
    throw new FonosterInvalidArgument(
      "e164Number field must be a valid e164 value."
    );
  }
};

export const assertWebhookIsURL = (webhook: string) => {
  if (webhook && !isValidURL(webhook)) {
    throw new FonosterInvalidArgument("webhook field must be a valid URL.");
  }
};

export const assertHasAorLinkOrIngressInfo = (
  request: NumbersPB.CreateNumberRequest | NumbersPB.UpdateNumberRequest
) => {
  if (
    !request.getAorLink() &&
    !request.getIngressInfo()?.getWebhook() &&
    !request.getIngressInfo()?.getAppRef()
  ) {
    throw new FonosterInvalidArgument(
      "You must provide either a 'webhook', 'appRef', or an 'aorLink'"
    );
  }
};

export const assertCompatibleParameters = (
  request: NumbersPB.CreateNumberRequest | NumbersPB.UpdateNumberRequest
) => {
  const aorLinkAndIngressInfo =
    request.getAorLink() && request.getIngressInfo();
  //const webhookAndAppRef = request.getIngressInfo()?.getAppRef() && request.getIngressInfo()?.getWebhook();

  if (aorLinkAndIngressInfo /*|| webhookAndAppRef*/) {
    throw new FonosterInvalidArgument(
      "you might provide only one of the following 'aorLink', 'webhook', or 'appRef'"
    );
  }
};

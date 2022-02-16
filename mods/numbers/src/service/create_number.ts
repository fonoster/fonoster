/* eslint-disable require-jsdoc */
import NumbersPB from "./protos/numbers_pb";
import { ResourceBuilder, Kind, routr, getAccessKeyId } from "@fonoster/core";
import numberDecoder from "./decoder";
import {
  assertCompatibleParameters,
  assertHasAorLinkOrIngressInfo,
  assertIsE164,
  assertWebhookIsURL
} from "./assertions";
import { getAppRef, getWebhook } from "./utils";

export default async function createNumber(
  request: NumbersPB.CreateNumberRequest,
  call: any
): Promise<NumbersPB.Number> {
  // TODO: Needs resource ownership validation for appRef
  assertIsE164(request.getE164Number());
  assertHasAorLinkOrIngressInfo(request);
  assertCompatibleParameters(request);
  assertWebhookIsURL(request.getIngressInfo()?.getWebhook());

  let encoder = new ResourceBuilder(Kind.NUMBER, request.getE164Number())
    .withGatewayRef(request.getProviderRef())
    .withMetadata({ accessKeyId: getAccessKeyId(call) });

  if (request.getAorLink()) {
    encoder = encoder.withLocation(
      `tel:${request.getE164Number()}`,
      request.getAorLink()
    );
  } else {
    encoder = encoder
      .withLocation(`tel:${request.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({
        webhook: getWebhook(request),
        appRef: getAppRef(request),
        accessKeyId: getAccessKeyId(call)
      });
  }

  await routr.connect();
  const resource = encoder.build();
  const ref = await routr.resourceType("numbers").create(resource);
  // We do this to get updated metadata from Routr
  const jsonObj = await routr.resourceType("numbers").get(ref);
  return numberDecoder(jsonObj);
}

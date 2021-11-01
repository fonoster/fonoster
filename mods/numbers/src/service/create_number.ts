/* eslint-disable require-jsdoc */
import NumbersPB from "./protos/numbers_pb";
import {ResourceBuilder, Kind, routr, getAccessKeyId} from "@fonoster/core";
import numberDecoder from "./decoder";
import {assertHasAorLinkOrIngressInfo, assertIsE164} from "./assertions";

export default async function createNumber(
  request: NumbersPB.CreateNumberRequest,
  call: any
): Promise<NumbersPB.Number> {
  assertIsE164(request.getE164Number());
  assertHasAorLinkOrIngressInfo(request);

  let encoder = new ResourceBuilder(Kind.NUMBER, request.getE164Number())
    .withGatewayRef(request.getProviderRef())
    .withMetadata({accessKeyId: getAccessKeyId(call)});

  if (request.getAorLink()) {
    encoder = encoder.withLocation(
      `tel:${request.getE164Number()}`,
      request.getAorLink()
    );
  } else {
    encoder = encoder
      .withLocation(`tel:${request.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({
        webhook: request.getIngressInfo().getWebhook().trim(),
        accessKeyId: getAccessKeyId(call)
      });
  }

  const resource = encoder.build();

  await routr.connect();

  const ref = await routr.resourceType("numbers").create(resource);
  // We do this to get updated metadata from Routr
  const jsonObj = await routr.resourceType("numbers").get(ref);
  return numberDecoder(jsonObj);
}

/* eslint-disable require-jsdoc */
import NumbersPB from "./protos/numbers_pb";
import {ResourceBuilder, Kind, routr, getAccessKeyId} from "@fonos/core";
import numberDecoder from "./decoder";
import {assertHasAorLinkOrIngressInfo, assertIsE164} from "../utils/assertions";

export default async function createNumber(
  number: NumbersPB.Number,
  call: any
): Promise<NumbersPB.Number> {
  assertIsE164(number);
  assertHasAorLinkOrIngressInfo(number);

  let encoder = new ResourceBuilder(Kind.NUMBER, number.getE164Number())
    .withGatewayRef(number.getProviderRef())
    .withMetadata({accessKeyId: getAccessKeyId(call)});

  if (number.getAorLink()) {
    encoder = encoder.withLocation(
      `tel:${number.getE164Number()}`,
      number.getAorLink()
    );
  } else {
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({
        webhook: number.getIngressInfo().getWebhook().trim(),
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

/* eslint-disable require-jsdoc */
import {FonosInvalidArgument, FonosFailedPrecondition} from "@fonos/errors";
import NumbersPB from "./protos/numbers_pb";
import {
  ResourceBuilder,
  Kind,
  routr,
  getAccessKeyId,
  getRedisConnection
} from "@fonos/core";
import numberDecoder from "./decoder";
import {assertHasAorLinkOrIngressInfo, assertIsE164} from "../utils/assertions";

const redis = getRedisConnection();

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
    // TODO: Perhaps I should place this in a ENV
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({webhook: number.getIngressInfo().getWebhook()});
  }

  const resource = encoder.build();

  await routr.connect();

  const ref = await routr.resourceType("numbers").create(resource);
  // We do this to get updated metadata from Routr
  const jsonObj = await routr.resourceType("numbers").get(ref);
  return numberDecoder(jsonObj);
}

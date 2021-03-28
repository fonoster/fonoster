import {FonosInvalidArgument, FonosFailedPrecondition} from "@fonos/errors";
import NumbersPB from "../protos/numbers_pb";
import routr from "../../common/routr";
import redis from "../../common/redis";
import {REncoder, Kind} from "../../common/resource_encoder";
import numberDecoder from "../../common/decoders/number_decoder";
import getAccessKeyId from "../../common/get_access_key_id";

const validateNumber = (number: NumbersPB.Number) => {
  if (!number.getE164Number()) {
    throw new FonosInvalidArgument(
      `e164Number field must be a valid e164 value.`
    );
  }

  if (number.getAorLink() && number.getIngressApp()) {
    throw new FonosInvalidArgument(
      `'ingressApp' and 'aorLink' are not compatible parameters`
    );
  } else if (!number.getAorLink() && !number.getIngressApp()) {
    throw new FonosInvalidArgument(
      `You must provider either an 'ingressApp' or and 'aorLink'`
    );
  }
};

export default async function createNumber(
  number: NumbersPB.Number,
  call: any
): Promise<NumbersPB.Number> {
  validateNumber(number);

  let encoder = new REncoder(Kind.NUMBER, number.getE164Number())
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
      .withMetadata({ingressApp: number.getIngressApp()});
  }

  const resource = encoder.build();

  await routr.connect();

  if (number.getIngressApp()) {
    const app = await redis.get(number.getIngressApp());

    if (!app)
      throw new FonosFailedPrecondition(
        `App ${number.getIngressApp()} doesn't exist`
      );

    await redis.set(
      `extlink:${number.getE164Number()}`,
      number.getIngressApp()
    );
  }

  const ref = await routr.resourceType("numbers").create(resource);
  // We do this to get updated metadata from Routr
  const jsonObj = await routr.resourceType("numbers").get(ref);
  return numberDecoder(jsonObj);
}

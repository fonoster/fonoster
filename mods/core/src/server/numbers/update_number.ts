import {FonosInvalidArgument, FonosFailedPrecondition} from "@fonos/errors";
import routr from "../../common/routr";
import redis from "../../common/redis";
import numberDecoder from "../../common/decoders/number_decoder";
import {REncoder, Kind} from "../../common/resource_encoder";

export default async function updateNumber(call: any, callback: any) {
  const number = call.request.getNumber();

  if (number.getAorLink() && number.getIngressApp()) {
    callback(
      new FonosInvalidArgument(
        `'ingressApp' and 'aorLink' are not compatible parameters`
      )
    );
    return;
  } else if (!number.getAorLink() && !number.getIngressApp()) {
    callback(
      new FonosInvalidArgument(
        `You must provider either an 'ingressApp' or and 'aorLink'`
      )
    );
    return;
  }

  let encoder = new REncoder(
    Kind.NUMBER,
    number.getE164Number(),
    number.getRef()
  );

  if (number.getAorLink()) {
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, number.getAorLink())
      .withMetadata({
        gwRef: number.getProviderRef(),
        createdOn: number.getCreateTime(),
        modifiedOn: number.getUpdateTime()
      });
  } else {
    // TODO: Perhaps I should place this in a ENV
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({
        ingressApp: number.getIngressApp(),
        gwRef: number.getProviderRef(),
        createdOn: number.getCreateTime(),
        modifiedOn: number.getUpdateTime()
      });
  }

  const resource = encoder.build();

  try {
    await routr.connect();
    const ref = await routr.resourceType("numbers").update(resource);

    if (number.getIngressApp()) {
      const app = await redis.get(number.getIngressApp());

      if (!app)
        throw new FonosFailedPrecondition(
          `App ${number.ingressApp} doesn't exist`
        );

      await redis.set(
        `extlink:${number.getE164Number()}`,
        number.getIngressApp()
      );
    } else {
      await redis.del(`extlink:${number.getE164Number()}`);
    }

    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType("numbers").get(ref);
    callback(null, numberDecoder(jsonObj));
  } catch (err) {
    return callback(err);
  }
}

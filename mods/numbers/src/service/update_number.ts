/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {FonosInvalidArgument} from "@fonoster/errors";
import {ResourceBuilder, Kind, routr, ResourceServer} from "@fonoster/core";
import numberDecoder from "./decoder";
import decoder from "./decoder";

export default async function updateNumber(call: any, callback: any) {
  const request = call.request;
  if (request.getAorLink() && request.getIngressInfo()) {
    callback(
      new FonosInvalidArgument(
        "'ingressInfo' and 'aorLink' are not compatible parameters"
      )
    );
    return;
  } else if (!request.getAorLink() && !request.getIngressInfo()) {
    callback(
      new FonosInvalidArgument(
        "You must provider either an 'ingressInfo' or and 'aorLink'"
      )
    );
    return;
  }

  const objectFromDB = decoder(
    await ResourceServer.getResource(Kind.NUMBER, call)
  );
  let encoder = new ResourceBuilder(
    Kind.NUMBER,
    objectFromDB.getE164Number(),
    objectFromDB.getRef()
  );

  if (request.getAorLink()) {
    encoder = encoder
      .withLocation(`tel:${objectFromDB.getE164Number()}`, request.getAorLink())
      .withMetadata({
        gwRef: request.getProviderRef(),
        createdOn: objectFromDB.getCreateTime()
      });
  } else {
    encoder = encoder
      .withLocation(
        `tel:${objectFromDB.getE164Number()}`,
        process.env.MS_ENDPOINT
      )
      .withMetadata({
        webhook: request.getIngressInfo()
          ? request.getIngressInfo().getWebhook().trim()
          : undefined,
        gwRef: objectFromDB.getProviderRef(),
        createdOn: objectFromDB.getCreateTime()
      });
  }

  try {
    await routr.connect();
    const ref = await routr.resourceType("numbers").update(encoder.build());

    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType("numbers").get(ref);
    callback(null, numberDecoder(jsonObj));
  } catch (err) {
    return callback(err);
  }
}

/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {FonosInvalidArgument} from "@fonos/errors";
import {ResourceBuilder, Kind, routr, ResourceServer} from "@fonos/core";
import numberDecoder from "./decoder";
import { UpdateNumberRequest } from "./protos/numbers_pb";

export default async function updateNumber(call: any, callback: any) {
  const request = call.request
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

  let encoder = new ResourceBuilder(
    Kind.NUMBER,
    request.getRef()
  );

  const number = await ResourceServer.getResource(Kind.NUMBER, call) as any;

  if (request.getAorLink()) {
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, request.getAorLink())
      .withMetadata({
        gwRef: request.getProviderRef(),
        createdOn: number.metadata.createdOn,
        modifiedOn: new Date().toISOString()
      });
  } else {
    encoder = encoder
      .withLocation(`tel:${number.getE164Number()}`, process.env.MS_ENDPOINT)
      .withMetadata({
        webhook: number.getIngressInfo()
          ? number.getIngressInfo().getWebhook().trim()
          : undefined,
        gwRef: number.getProviderRef(),
        createdOn: number.getCreateTime(),
        modifiedOn: number.getUpdateTime()
      });
  }

  const resource = encoder.build();

  try {
    await routr.connect();
    const ref = await routr.resourceType("numbers").update(resource);

    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType("numbers").get(ref);
    callback(null, numberDecoder(jsonObj));
  } catch (err) {
    return callback(err);
  }
}

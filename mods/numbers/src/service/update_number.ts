/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ResourceBuilder, Kind, routr, ResourceServer } from "@fonoster/core";
import numberDecoder from "./decoder";
import decoder from "./decoder";
import {
  assertCompatibleParameters,
  assertHasAorLinkOrIngressInfo,
  assertWebhookIsURL
} from "./assertions";
import { getAppRef, getWebhook } from "./utils";
import logger from "@fonoster/logger";

export default async function updateNumber(call: any, callback: any) {
  const request = call.request;
  try {
    assertHasAorLinkOrIngressInfo(request);
    assertCompatibleParameters(request);
    assertWebhookIsURL(request.getIngressInfo()?.getWebhook());

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
        .withLocation(
          `tel:${objectFromDB.getE164Number()}`,
          request.getAorLink()
        )
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
          webhook: getWebhook(request),
          appRef: getAppRef(request),
          gwRef: objectFromDB.getProviderRef(),
          createdOn: objectFromDB.getCreateTime()
        });
    }

    await routr.connect();
    const ref = await routr.resourceType("numbers").update(encoder.build());

    // We do this to get updated metadata from Routr
    const jsonObj = await routr.resourceType("numbers").get(ref);
    callback(null, numberDecoder(jsonObj));
  } catch (err) {
    return callback(err);
  }
}

import {routr} from "@fonos/core";
import grpc from "grpc";
import client from "ari-client";
import {CallRequest, CallResponse} from "./protos/callmanager_pb";
import originate, {EndpointInfo} from "./call";
import {ICallManagerServer} from "./protos/callmanager_grpc_pb";
import logger from "@fonos/logger";

class CallManagerServer implements ICallManagerServer {
  async call(
    call: grpc.ServerUnaryCall<CallRequest>,
    callback: grpc.sendUnaryData<CallResponse>
  ) {
    const getDomainByNumber = async (e164Number: string) => {
      await routr.connect();
      return await routr.getDomainUriFromNumber(e164Number);
    };

    const domain = await getDomainByNumber(call.request.getFrom());

    logger.debug("@core/callmanager call [originating call]");
    logger.debug(`@core/callmanager call [ari url ${process.env.MS_ARI_URL}]`);
    logger.debug(
      `@core/callmanager call [ari username ${process.env.MS_ARI_USERNAME}]`
    );
    logger.debug(
      `@core/callmanager call [endpoint ${process.env.MS_TRUNK}/${process.env.MS_CONTEXT}/${process.env.MS_EXTENSION}]`
    );
    logger.debug(`@core/callmanager call [domain ${domain}]`);

    try {
      const epInfo: EndpointInfo = {
        domain,
        trunk: process.env.MS_TRUNK,
        context: process.env.MS_CONTEXT,
        extension: process.env.MS_EXTENSION
      };

      const conn = await client.connect(
        process.env.MS_ARI_URL,
        process.env.MS_ARI_USERNAME,
        process.env.MS_ARI_SECRET
      );
      const channel = conn.Channel();
      callback(null, await originate(call.request, channel, epInfo));
    } catch (e) {
      callback(e, null);
    }
  }
}

export {CallManagerServer as default, ICallManagerServer, CallManagerServer};

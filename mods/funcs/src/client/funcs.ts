import {FonosService, ServiceOptions} from "@fonos/core";
import {FuncsClient} from "../service/protos/funcs_grpc_pb";
import FuncsPB from "../service/protos/funcs_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import grpc from "grpc";

// eslint-disable-next-line require-jsdoc
export default class Funcs extends FonosService {
  // eslint-disable-next-line require-jsdoc
  constructor(options?: ServiceOptions) {
    super(FuncsClient, options);
    super.init(grpc);
    this.service = super.getService();
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  // eslint-disable-next-line require-jsdoc
  async deployApp(appPath: string, appRef?: string): Promise<unknown> {
    return null;
  }
}

export {FuncsPB, CommonPB};

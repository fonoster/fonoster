import grpc from "grpc";
import createApp from "./create_app";
import listApps from "./list_apps";
import getApp from "./get_app";
import deleteApp from "./delete_app";
import {
  App,
  ListAppsRequest,
  ListAppsResponse,
  GetAppRequest,
  CreateAppRequest,
  UpdateAppRequest,
  DeleteAppRequest
} from "../protos/appmanager_pb";
import { Empty } from "../protos/common_pb";
import getAccessKeyId from "../../common/get_access_key_id";

import {
  IAppManagerService,
  AppManagerService,
  IAppManagerServer
} from "../protos/appmanager_grpc_pb";

class AppManagerServer implements IAppManagerServer {
  async listApps(
    call: grpc.ServerUnaryCall<ListAppsRequest>,
    callback: grpc.sendUnaryData<ListAppsResponse>
  ) {
    try {
      const result = await listApps(
        parseInt(call.request.getPageToken()),
        call.request.getPageSize(),
        getAccessKeyId(call)
      );
      const response = new ListAppsResponse();
      response.setAppsList(result.apps);
      if (result.pageToken) response.setNextPageToken("" + result.pageToken);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }

  async getApp(
    call: grpc.ServerUnaryCall<GetAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    try {
      callback(null, await getApp(call.request.getRef(), getAccessKeyId(call)));
    } catch (e) {
      callback(e, null);
    }
  }

  async createApp(
    call: grpc.ServerUnaryCall<CreateAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    try {
      callback(
        null,
        await createApp(call.request.getApp(), getAccessKeyId(call))
      );
    } catch (e) {
      callback(e, null);
    }
  }

  updateApp(
    call: grpc.ServerUnaryCall<UpdateAppRequest>,
    callback: grpc.sendUnaryData<App>
  ): void {}

  async deleteApp(
    call: grpc.ServerUnaryCall<DeleteAppRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await deleteApp(call.request.getRef(), getAccessKeyId(call));
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { AppManagerServer as default, IAppManagerService, AppManagerService };

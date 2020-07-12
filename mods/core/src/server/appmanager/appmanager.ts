import grpc from 'grpc'
import { FonosAuthError } from '@fonos/errors'
import createApp from './create_app'
import listApps from './list_apps'
import getApp from './get_app'
import deleteApp from './delete_app'
import {
  App,
  ListAppsRequest,
  ListAppsResponse,
  GetAppRequest,
  CreateAppRequest,
  UpdateAppRequest,
  DeleteAppRequest
} from '../protos/appmanager_pb'
import { Empty } from '../protos/common_pb'
import { auth } from '../../common/trust_util'
import {
  IAppManagerService,
  AppManagerService,
  IAppManagerServer
} from '../protos/appmanager_grpc_pb'

class AppManagerServer implements IAppManagerServer {
  async listApps (
    call: grpc.ServerUnaryCall<ListAppsRequest>,
    callback: grpc.sendUnaryData<ListAppsResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)

    try {
      const result = await listApps(
        parseInt(call.request.getPageToken()),
        call.request.getPageSize()
      )
      const response = new ListAppsResponse()
      response.setAppsList(result.apps)
      if (result.pageToken) response.setNextPageToken('' + result.pageToken)
      callback(null, response)
    } catch (e) {
      callback(e, null)
    }
  }

  async getApp (
    call: grpc.ServerUnaryCall<GetAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      const app = await getApp(call.request.getName())
      callback(null, app)
    } catch (e) {
      callback(e, null)
    }
  }

  async createApp (
    call: grpc.ServerUnaryCall<CreateAppRequest>,
    callback: grpc.sendUnaryData<App>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      callback(null, await createApp(call.request.getApp()))
    } catch (e) {
      callback(e, null)
    }
  }

  updateApp (
    call: grpc.ServerUnaryCall<UpdateAppRequest>,
    callback: grpc.sendUnaryData<App>
  ): void {
    if (!auth(call)) return callback(new FonosAuthError(), null)
  }

  async deleteApp (
    call: grpc.ServerUnaryCall<DeleteAppRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    try {
      await deleteApp(call.request.getName())
      callback(null, new Empty())
    } catch (e) {
      callback(e, null)
    }
  }
}

export { AppManagerServer as default, IAppManagerService, AppManagerService }

/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Storage from "@fonoster/storage";
import { APIClient, ClientOptions } from "@fonoster/common";
import { FuncsClient } from "../service/protos/funcs_grpc_pb";
import FuncsPB from "../service/protos/funcs_pb";
import CommonPB from "../service/protos/common_pb";
import {
  DeleteFuncRequest,
  DeleteFuncResponse,
  DeployFuncRequest,
  GetFuncLogsRequest,
  GetFuncRequest,
  GetFuncResponse,
  IFuncsClient,
  ListFuncsRequest,
  ListFuncsResponse
} from "./types";
import {
  buildDeployFuncRequest,
  cleanupTmpDirSync,
  copyFuncAtTmp
} from "../utils/utils";
import { DeployStream, LogsStream } from "./stream_wrappers";

/**
 * @classdesc Use Fonoster Funcs, a capability of FaaS subsystem,
 * to deploy, update, get and delete functions. Fonoster Funcs requires of a
 * running Fonoster deployment and FaaS.
 *
 * @extends APIClient
 * @example
 *
 * const request = {
 *   name: "function1",
 *   path: "/path/to/function",
 * };
 *
 * funcs.deployFunc(request)
 * .then(stream => {
 *   stream.onMessage(msg => console.log(msg))
 *   stream.onFinish(() => console.log("end"))
 *   stream.onError(e => console.error(e))
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Funcs extends APIClient implements IFuncsClient {
  storage: any;
  /**
   * Constructs a new Funcs object.
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(FuncsClient, options);
    super.init();
    this.storage = new Storage(super.getOptions());
  }

  /**
   * Creates or updates a function in the FaaS subsystem.
   *
   * @param {DeployFuncRequest} request - Request to create or update a function
   * @param {string} request.path - Path to the function.
   * @param {string} request.name - Unique function name
   * @param {string} request.schedule - Unique function name
   * @param {string} request.limit.memory - Optional limit for function's memory utilization
   * @param {string} request.limit.cpu - Optional limit for function's cpu utilization
   * @param {string} request.requests.memory - Optional requested memory allocation for the function
   * @param {string} request.requests.cpu - Optional requested cpu allocation for the function
   * @return {Promise<DeployStream>}
   * @example
   *
   * const Fonoster = require("@fonoster/sdk");
   * const funcs = new Fonoster.Funcs();
   *
   * const request = {
   *   name: "function1",
   *   schedule: "* * * * *",  // Intervals using standard cron syntax
   *   path: "/path/to/function",
   *   limits: {
   *      cpu: 100m,
   *      memory: 40Mi
   *   },
   *   requests: {
   *      cpu: 100m,
   *      memory: 40Mi
   *   }
   * };
   *
   * funcs.deployFunc(request)
   * .then(stream => {
   *   stream.onMessage(msg => console.log(msg))
   *   stream.onFinish(() => console.log("end"))
   *   stream.onError(e => console.error(e))
   * }).catch(e => console.error(e));   // an error occurred
   */
  async deployFunc(request: DeployFuncRequest): Promise<DeployStream> {
    if (request.path) {
      cleanupTmpDirSync(request.name);
      await copyFuncAtTmp(request.path, request.name);
      await this.storage.uploadObject({
        filename: `/tmp/${request.name}.tgz`,
        bucket: "funcs"
      });
    }
    cleanupTmpDirSync(request.name);
    const req = buildDeployFuncRequest(request);
    const stream = super.getService().deployFunc(req, super.getMeta());
    return new DeployStream(stream);
  }

  /**
   * Gets a system function by name.
   *
   * @param {GetFuncRequest} request - Request to get a function
   * @param {string} request.name - Unique function name
   * @return {Promise<GetFuncResponse>}
   * @example
   *
   * const request = {
   *   name: "function1"
   * };
   *
   * funcs.getFunc(request)
   * .then(result => {
   *   console.log(result)              // successful response with the function as the body65
   * }).catch(e => console.error(e));   // an error occurred
   */
  async getFunc(request: GetFuncRequest): Promise<GetFuncResponse> {
    return new Promise((resolve, reject) => {
      const req = new FuncsPB.GetFuncRequest();
      req.setName(request.name);
      super
        .getService()
        .getFunc(req, super.getMeta(), (e, res: FuncsPB.Func) => {
          if (e) return reject(e);

          resolve({
            name: res.getName(),
            schedule: res.getSchedule(),
            image: res.getImage(),
            invocationCount: res.getInvocationCount(),
            replicas: res.getReplicas(),
            availableReplicas: res.getAvailableReplicas()
          });
        });
    });
  }

  /**
   * Removes a function by its name.
   *
   * @param {DeleteFuncRequest} request - Request to delete a function
   * @param {string} request.name - Unique function name
   * @return {Promise<GetFuncResponse>}
   * @note This action will remove all function statistics.
   * @example
   *
   * const request = {
   *   name: "function1"
   * };
   *
   * funcs.deleteFunc(request)
   * .then(result => {
   *   console.log(result)              // returns the name of the function
   * }).catch(e => console.error(e));   // an error occurred
   */
  async deleteFunc(request: DeleteFuncRequest): Promise<DeleteFuncResponse> {
    return new Promise((resolve, reject) => {
      const req = new FuncsPB.DeleteFuncRequest();
      req.setName(request.name);
      super.getService().deleteFunc(req, super.getMeta(), (e: any) => {
        if (e) reject(e);

        resolve({
          name: request.name
        });
      });
    });
  }

  /**
   * Returns a list of functions owned by the User.
   *
   * @param {ListFuncsRequest} request
   * @param {number} request.pageSize - Number of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListFuncsResponse>} List of Functions
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * };
   *
   * funcs.listFuncs(request)
   * .then(() => {
   *   console.log(result)             // returns a ListFuncsResponse object
   * }).catch(e => console.error(e));  // an error occurred
   */
  async listFuncs(request: ListFuncsRequest): Promise<ListFuncsResponse> {
    return new Promise((resolve, reject) => {
      const req = new FuncsPB.ListFuncsRequest();
      req.setPageSize(request.pageSize);
      req.setPageToken(request.pageToken);
      req.setView(request.view);
      super
        .getService()
        .listFuncs(
          req,
          super.getMeta(),
          (e: any, paginatedList: FuncsPB.ListFuncsResponse) => {
            if (e) reject(e);

            resolve({
              nextPageToken: paginatedList.getNextPageToken(),
              funcs: paginatedList.getFuncsList().map((f: FuncsPB.Func) => {
                return {
                  name: f.getName(),
                  image: f.getImage(),
                  replicas: f.getReplicas(),
                  invocationCount: f.getInvocationCount(),
                  availableReplicas: f.getAvailableReplicas(),
                  schedule: f.getSchedule()
                };
              })
            });
          }
        );
    });
  }

  /**
   * Creates or updates a function in the FaaS subsystem.
   *
   * @param {GetFuncLogsRequest} request - Request to obtain the logs for a function
   * @param {string} request.name - Function name
   * @param {string} request.since - Only return logs after a specific date (RFC3339)
   * @param {string} request.tail - Sets the maximum number of log messages to return, <=0 means unlimited
   * @param {string} request.follow - When true, the request will stream logs until the request timeout
   * @return {Promise<LogsStream>}
   * @example
   *
   * const Fonoster = require("@fonoster/sdk");
   * const funcs = new Fonoster.Funcs();
   *
   * const request = {
   *   name: "function1",
   *   tail: 10,
   *   follow: true,
   *   since: "2021-05-12T07:20:50.52Z"
   * };
   *
   * funcs.getFuncLogs(request)
   * .then(stream => {
   *   stream.onMessage(log => console.log(log))
   *   stream.onFinish(() => console.log("end"))
   *   stream.onError(e => console.error(e))
   * }).catch(e => console.error(e));   // an error occurred
   */
  async getFuncLogs(request: GetFuncLogsRequest): Promise<LogsStream> {
    const req = new FuncsPB.GetFuncLogsRequest();
    req.setName(request.name);
    req.setSince(request.since);
    req.setTail(request.tail);
    req.setFollow(request.follow);
    const stream = super.getService().getFuncLogs(req, super.getMeta());
    return new LogsStream(stream);
  }
}

export { FuncsPB, CommonPB, buildDeployFuncRequest, IFuncsClient };

// WARNING: Workaround to support commonjs clients
module.exports = Funcs;
module.exports.FuncsPB = FuncsPB;
module.exports.CommonPB = CommonPB;
module.exports.buildDeployFuncRequest = buildDeployFuncRequest;

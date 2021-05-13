/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {FonosService, ServiceOptions} from "@fonos/core";
import {FuncsClient} from "../service/protos/funcs_grpc_pb";
import FuncsPB from "../service/protos/funcs_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import grpc from "grpc";
import { DeleteFuncRequest, DeleteFuncResponse, DeployFuncRequest, DeployFuncResponse, GetFuncRequest, GetFuncResponse, ListFuncsRequest, ListFuncsResponse } from "../types";

const createFuncFromRequest = (request: DeployFuncRequest) => {
  const limits = new FuncsPB.Resource();
  limits.setCpu(request.limits.cpu)
  limits.setMemory(request.limits.memory)

  const requests = new FuncsPB.Resource();
  requests.setCpu(request.requests.cpu)
  requests.setMemory(request.requests.memory)

  const func = new FuncsPB.Func();
  func.setName(request.name);
  func.setImage(request.image);
  func.setLimits(limits);
  func.setRequests(requests);
  return func;
}

/**
 * @classdesc Use Fonos Funcs, a capability of FaaS subsystem,
 * to deploy, update, get and delete functions. Fonos Funcs requires of a
 * running Fonos deployment and FaaS.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk");
 * const funcs = new Fonos.Funcs();
 * 
 * const request = {
 *   name: "function1",
 *   image: "docker.io/functions/function1:latest",
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
 * .then(result => {
 *   console.log(result)              // successful response
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Funcs extends FonosService {
  /**
   * Constructs a new Funcs object.
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(FuncsClient, options);
    super.init(grpc);
    //this.service = super.getService();
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Creates or updates a function in the FaaS subsystem.
   *
   * @param {DeployFuncRequest} request - Request to create or update a function
   * @param {string} request.name - Unique function name 
   * @param {string} request.image - An image available in a public or private docker registry
   * @param {string} request.limit.memory - Optional limit for function's memory utilization
   * @param {string} request.limit.cpu - Optional limit for function's cpu utilization
   * @param {string} request.requests.memory - Optional requested memory allocation for the function
   * @param {string} request.requests.cpu - Optional requested cpu allocation for the function
   * @return {Promise<DeployFuncResponse>}
   * @example
   *
   * const request = {
   *   name: "function1",
   *   image: "docker.io/functions/function1",
   * };
   *
   * funcs.deployFunc(request)
   * .then(result => {
   *   console.log(result)              // successful response
   * }).catch(e => console.error(e));   // an error occurred
   */ 
  async deployFunc(request: DeployFuncRequest): Promise<DeployFuncResponse> {
    const req = new FuncsPB.CreateFuncRequest();
    req.setFunc(createFuncFromRequest(request));

    let exist = false;
    
    try {
      this.getFunc({name:request.name})
      exist = true;
    } catch(e) {
      // TODO: If the error is different than 400 we should pass error to the client 
    }

    let res = null;

    if (!exist) {
      res = await super.getService().createFunc().sendMessage(req);
    } else {
      res = await super.getService().updateFunc().sendMessage(req);
    }

    return {
      name: res.getName(),
      image: res.getImage(),
      invocationCount: res.getInvocationCount(),
      replicas: res.getReplicas(),
      availableReplicas: res.getAvailableReplicas()
    };
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
    const req = new FuncsPB.GetFuncRequest();
    req.setRef(request.name);

    const res = await super.getService().getFunc().sendMessage(req);

    return {
      name: res.getName(),
      image: res.getImage(),
      invocationCount: res.getInvocationCount(),
      replicas: res.getReplicas(),
      availableReplicas: res.getAvailableReplicas()
    };
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
    const req = new FuncsPB.DeleteFuncRequest();
    req.setRef(request.name);
    await super.getService().deleteFunc().sendMessage(req);
    return {
      name: request.name
    };
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
    const r = new FuncsPB.ListFuncsRequest();
    r.setPageSize(request.pageSize);
    r.setPageToken(request.pageToken);
    r.setView(request.view);
    const paginatedList = await this.getService().listFuncs().sendMessage(r);
    return {
      nextPageToken: paginatedList.getNextPageToken(),
      funcs: paginatedList.getFuncsList().map((f: FuncsPB.Func) => {
        return {
          name: f.getName(),
          image: f.getImage(),
          replicas: f.getReplicas(),
          invocationCount: f.getInvocationCount(),
          availableReplicas: f.getAvailableReplicas()
        };
      })
    };
  }
}

export {FuncsPB, CommonPB, createFuncFromRequest};

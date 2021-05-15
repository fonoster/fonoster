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
import grpc from "grpc";
import {Empty} from "./protos/common_pb";
import {
  IFuncsService,
  FuncsService,
  IFuncsServer
} from "./protos/funcs_grpc_pb";
import {
  CreateRegistryTokenRequest,
  CreateRegistryTokenResponse,
  CreateFuncRequest,
  UpdateFuncRequest,
  DeleteFuncRequest,
  Func,
  FuncLog,
  GetFuncLogsRequest,
  GetFuncRequest,
  ListFuncsRequest,
  ListFuncsResponse
} from "./protos/funcs_pb";
import {HttpBasicAuth, DefaultApi as FaaS} from "openfaas-client";
import logger from "@fonos/logger";
import {ErrorCodes, FonosError, FonosSubsysUnavailable} from "@fonos/errors";
import {getAccessKeyId} from "@fonos/core";
import axios from "axios";
import {FuncsPB} from "../client/funcs";

// Initializing access info for FaaS
const faas = new FaaS();
const auth = new HttpBasicAuth();
auth.username = process.env.FUNCS_USERNAME;
auth.password = process.env.FUNCS_SECRET;
faas.setDefaultAuthentication(auth);
faas.basePath = process.env.FUNCS_URL;

const getFuncName = (accessKeyId: string, name: string) =>
  `fn.${accessKeyId}.${name}`;

const getImageName = (accessKeyId: string, name: string) =>
  `${process.env.DOCKER_REGISTRY_REPO}/fn.${accessKeyId}.${name}`;

interface FuncParameters {
  request: CreateFuncRequest;
  accessKeyId: string;
  jwtSignature: string;
}

const prepareParameters = (params: FuncParameters) => {
  const parameters = {
    service: getFuncName(params.accessKeyId, params.request.getName()),
    image: getImageName(params.accessKeyId, params.request.getName()),
    limits: {
      memory: undefined,
      cpu: undefined
    },
    requests: {
      memory: undefined,
      cpu: undefined
    },
    envProcess: "npm run start",
    registryAuth: process.env.DOCKER_REGISTRY_AUTH,
    labels: {
      funcName: params.request.getName()
    },
    envVars: {
      ACCESS_KEY_ID: params.accessKeyId,
      JWT_SIGNATURE: params.jwtSignature
    }
  };
  const limits = params.request.getLimits();
  const requests = params.request.getRequests();

  if (limits && limits.getMemory())
    parameters.limits.memory = limits.getMemory();
  if (limits && limits.getCpu()) parameters.limits.cpu = limits.getCpu();
  if (requests && requests.getMemory())
    parameters.requests.memory = requests.getMemory();
  if (requests && requests.getCpu())
    parameters.requests.cpu = requests.getCpu();

  return parameters;
};

const rawFuncToFunc = (rawFunc: any) => {
  const func = new Func();
  func.setName(rawFunc.labels.funcName);
  func.setImage(rawFunc.image);
  func.setInvocationCount(rawFunc.invocationCount);
  func.setReplicas(rawFunc.replicas);
  func.setAvailableReplicas(rawFunc.availableReplicas);
  return func;
};

class FuncsServer implements IFuncsServer {
  getFuncLogs: grpc.handleServerStreamingCall<GetFuncLogsRequest, FuncLog>;

  // See client-side for comments
  async listFuncs(
    call: grpc.ServerUnaryCall<ListFuncsRequest>,
    callback: grpc.sendUnaryData<ListFuncsResponse>
  ) {
    if (!call.request.getPageToken()) callback(null, new ListFuncsResponse());
    const accessKeyId = getAccessKeyId(call);
    const list = (await faas.systemFunctionsGet()).response.body;
    const rawFuncs = list.filter(
      (f) => f.envVars.ACCESS_KEY_ID === accessKeyId
    );

    const funcs = rawFuncs.map((f) => rawFuncToFunc(f));
    const response = new ListFuncsResponse();
    response.setFuncsList(funcs);
    // No pagination need because the list of function is likely to be short
    // response.setNextPageToken()

    callback(null, response);
  }

  // See client-side for comments
  async getFunc(
    call: grpc.ServerUnaryCall<GetFuncRequest>,
    callback: grpc.sendUnaryData<Func>
  ) {
    try {
      const list = (await faas.systemFunctionsGet()).response.body;
      const accessKeyId = getAccessKeyId(call);
      const rawFunction = list.filter(
        (f) => f.name === getFuncName(accessKeyId, call.request.getName())
      )[0];

      if (!rawFunction)
        throw new FonosError(
          `Function name "${call.request.getName()}" doesn't exist`,
          ErrorCodes.NOT_FOUND
        );

      callback(null, rawFuncToFunc(rawFunction));
    } catch (e) {
      callback(e, null);
    }
  }

  // See client-side for comments
  async createFunc(
    call: grpc.ServerUnaryCall<CreateFuncRequest>,
    callback: grpc.sendUnaryData<Func>
  ) {
    try {
      const parameters = prepareParameters({
        request: call.request,
        accessKeyId: getAccessKeyId(call),
        jwtSignature: "" // TODO
      });
      await faas.systemFunctionsPost(parameters);
      const func = new FuncsPB.Func();

      callback(null, func);
    } catch (e) {
      if (e.response.body.includes("already exists")) {
        callback(
          new FonosError(
            "Entity already exist",
            ErrorCodes.ENTITY_ALREADY_EXIST
          ),
          null
        );
      } else if (e.response.statusCode === 400) {
        callback(
          new FonosError(e.response.body, ErrorCodes.INVALID_ARGUMENT),
          null
        );
      } else if (e.response.statusCode === 401) {
        callback(
          new FonosSubsysUnavailable("Functions subsystem unavailable"),
          null
        );
      }
      callback(e.response, null);
    }
  }

  // See client-side for comments
  async updateFunc(
    call: grpc.ServerUnaryCall<UpdateFuncRequest>,
    callback: grpc.sendUnaryData<Func>
  ) {
    try {
      const accessKeyId = getAccessKeyId(call);
      const parameters = prepareParameters({
        request: call.request,
        accessKeyId: accessKeyId,
        jwtSignature: "" // TODO
      });
      await faas.systemFunctionsPut(parameters);
      // Get result from the system
      const list = (await faas.systemFunctionsGet()).response.body;
      const rawFunction = list.filter(
        (f) => f.name === getFuncName(accessKeyId, call.request.getName())
      )[0];

      callback(null, rawFuncToFunc(rawFunction));
    } catch (e) {
      logger.error(e.message);
      if (e.response.statusCode === 400) {
        callback(
          new FonosError(e.response.body, ErrorCodes.INVALID_ARGUMENT),
          null
        );
      } else if (e.response.statusCode === 401) {
        callback(
          new FonosSubsysUnavailable("Functions subsystem unavailable"),
          null
        );
      } else if (e.response.statusCode === 404) {
        callback(new FonosError(e.response.body, ErrorCodes.NOT_FOUND), null);
      }
      callback(e.response, null);
    }
  }

  // See client-side for comments
  async deleteFunc(
    call: grpc.ServerUnaryCall<DeleteFuncRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    const accessKeyId = getAccessKeyId(call);
    const functionName = getFuncName(accessKeyId, call.request.getName());
    try {
      await faas.systemFunctionsDelete({functionName});
      callback(null, new Empty());
    } catch (e) {
      if (e.response.statusCode === 404) {
        callback(
          new FonosError(
            `Function name "${call.request.getName()}" doesn't exist`,
            ErrorCodes.NOT_FOUND
          ),
          null
        );
      }
      callback(e, null);
    }
  }

  /**
   * This function creates a single use, scoped token, useful for pushing images
   * to a private Docker registry.
   */
  async createRegistryToken(
    call: grpc.ServerUnaryCall<CreateRegistryTokenRequest>,
    callback: grpc.sendUnaryData<CreateRegistryTokenResponse>
  ) {
    try {
      if (!call.request.getFuncName())
        throw new FonosError(
          "Missing function name",
          ErrorCodes.INVALID_ARGUMENT
        );
      const endpoint = process.env.DOCKER_REGISTRY_AUTH_ENDPOINT;
      const service = process.env.DOCKER_REGISTRY_SERVICE;
      const auth = process.env.DOCKER_REGISTRY_AUTH;
      const accessKeyId = getAccessKeyId(call);
      const image = getImageName(accessKeyId, call.request.getFuncName());
      const baseURL = `${endpoint}?service=${service}&scope=repository:${image}:push`;
      const result = await axios
        .create({
          headers: {Authorization: `Basic ${auth}`}
        })
        .get(baseURL);
      const token = result.data.token;
      const res = new CreateRegistryTokenResponse();
      res.setToken(token);
      res.setImage(image);
      callback(null, res);
    } catch (e) {
      callback(new FonosError(e), null);
    }
  }
}

export {FuncsServer as default, IFuncsService, FuncsService};

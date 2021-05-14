import grpc from "grpc";
import {Empty} from "./protos/common_pb";
import {
  IFuncsService,
  FuncsService,
  IFuncsServer
} from "./protos/funcs_grpc_pb";
import {
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

// Initializing access info for FaaS
const faas = new FaaS();
const auth = new HttpBasicAuth();
auth.username = process.env.FUNCS_USERNAME;
auth.password = process.env.FUNCS_SECRET;
faas.setDefaultAuthentication(auth);
faas.basePath = process.env.FUNCS_URL;

const getFuncName = (accessKeyId: string, name: string) =>
  `fn-${accessKeyId}-${name}`;

interface FuncParameters {
  func: Func;
  accessKeyId: string;
  jwtSignature: string;
}

const prepareParameters = (params: FuncParameters) => {
  const parameters = {
    service: getFuncName(params.accessKeyId, params.func.getName()),
    image: params.func.getImage(),
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
      funcName: params.func.getName()
    },
    envVars: {
      ACCESS_KEY_ID: params.accessKeyId,
      JWT_SIGNATURE: params.jwtSignature
    }
  };
  const limits = params.func.getLimits();
  const requests = params.func.getRequests();

  if (limits && limits.getMemory()) parameters.limits.memory = limits.getMemory();
  if (limits && limits.getCpu()) parameters.limits.cpu = limits.getCpu();
  if (requests && requests.getMemory()) parameters.requests.memory = requests.getMemory();
  if (requests && requests.getCpu()) parameters.requests.cpu = requests.getCpu();

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
        func: call.request.getFunc(),
        accessKeyId: getAccessKeyId(call),
        jwtSignature: "" // TODO
      });
      await faas.systemFunctionsPost(parameters);
      callback(null, call.request.getFunc());
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
        func: call.request.getFunc(),
        accessKeyId: accessKeyId,
        jwtSignature: "" // TODO
      });
      await faas.systemFunctionsPut(parameters);
      // Get result from the system
      const list = (await faas.systemFunctionsGet()).response.body;
      const rawFunction = list.filter(
        (f) =>
          f.name === getFuncName(accessKeyId, call.request.getFunc().getName())
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
}

export {FuncsServer as default, IFuncsService, FuncsService};

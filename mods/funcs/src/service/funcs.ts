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
import grpc, { ServerWritableStream } from "@grpc/grpc-js";
import { Empty } from "./protos/common_pb";
import { IFuncsServer } from "./protos/funcs_grpc_pb";
import {
  CreateRegistryTokenRequest,
  CreateRegistryTokenResponse,
  DeployFuncRequest,
  DeployStream,
  DeleteFuncRequest,
  Func,
  FuncLog,
  GetFuncLogsRequest,
  GetFuncRequest,
  ListFuncsRequest,
  ListFuncsResponse
} from "./protos/funcs_pb";
import { HttpBasicAuth, DefaultApi as FaaS } from "openfaas-client";
import logger from "@fonoster/logger";
import {
  ErrorCodes,
  FonosterError,
  FonosterSubsysUnavailable
} from "@fonoster/errors";
import { getAccessKeyId } from "@fonoster/core";
import axios from "axios";
import {
  rawFuncToFunc,
  getFuncName,
  buildFaasDeployParameters,
  getImageName,
  getBuildDir,
  assertValidFuncName,
  assertValidSchedule
} from "../utils/utils";
import buildAndPublishImage from "./registry";
import btoa from "btoa";
import request from "request";
import ndjson from "ndjson";
import { promisify } from "util";

const sleep = promisify(setTimeout);

// Initializing access info for FaaS
const faas = new FaaS();
const auth = new HttpBasicAuth();
auth.username = process.env.FUNCS_USERNAME;
auth.password = process.env.FUNCS_SECRET;
faas.setDefaultAuthentication(auth);
faas.basePath = process.env.FUNCS_URL;

export class ServerStream {
  call: any;
  constructor(call) {
    this.call = call;
  }

  write(message: string) {
    const msg = new DeployStream();
    msg.setText(message);
    this.call.write(msg);
  }
}

const publish = async (
  call: grpc.ServerUnaryCall<DeployFuncRequest, any>,
  serverStream: ServerStream
) => {
  serverStream.write("finished running predeploy script");
  const accessKeyId = getAccessKeyId(call);
  const parameters = await buildFaasDeployParameters({
    request: call.request,
    accessKeyId: accessKeyId
  });

  await buildAndPublishImage(
    {
      registry: process.env.DOCKER_REGISTRY,
      image: parameters.image,
      pathToFunc: getBuildDir(accessKeyId, call.request.getName()),
      username: process.env.DOCKER_REGISTRY_USERNAME,
      secret: process.env.DOCKER_REGISTRY_SECRET
    },
    serverStream
  );

  logger.verbose("@fonoster/funcs publish [publishing to funcs subsystem]");

  const attempts = [1, 2, 3];
  let index;
  for (index in attempts) {
    // Sometime the image is not inmediatly available so we try a few times
    logger.verbose(
      `@fonoster/funcs publish [publishing to functions subsystem (try #${attempts[index]})`
    );
    serverStream.write("wating for image to be ready");
    serverStream.write(
      `publishing to functions subsystem (it might take awhile #${attempts[index]})`
    );
    await sleep(20000);
    try {
      // If the function already exist this will fail
      logger.verbose("@fonoster/funcs publish [first trying post]");
      await faas.systemFunctionsPost(parameters);
      break;
    } catch (e) {
      logger.verbose("@fonoster/funcs publish [now trying put]");
      try {
        await faas.systemFunctionsPut(parameters);
        break;
      } catch (e) {}
    }
  }

  return parameters;
};

export default class FuncsServer implements IFuncsServer {
  [name: string]: grpc.UntypedHandleCall;
  // See client-side for comments
  async listFuncs(
    call: grpc.ServerUnaryCall<ListFuncsRequest, ListFuncsResponse>,
    callback: grpc.sendUnaryData<ListFuncsResponse>
  ) {
    try {
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
    } catch (e) {
      logger.error(`@fonoster/funcs list [${e}]`);
    }
  }

  // See client-side for comments
  async getFunc(
    call: grpc.ServerUnaryCall<GetFuncRequest, Func>,
    callback: grpc.sendUnaryData<Func>
  ) {
    try {
      const list = (await faas.systemFunctionsGet()).response.body;
      const accessKeyId = getAccessKeyId(call);
      const rawFunction: Func = list.filter(
        (f) => f.name === getFuncName(accessKeyId, call.request.getName())
      )[0];

      if (!rawFunction)
        throw new FonosterError(
          `function name "${call.request.getName()}" doesn't exist`,
          ErrorCodes.NOT_FOUND
        );

      callback(null, rawFuncToFunc(rawFunction));
    } catch (e) {
      logger.error(`@fonoster/funcs get [${e}]`);
      callback(e, null);
    }
  }

  // See client-side for comments
  // TODO: Resign with JWT token
  async deployFunc(
    call: ServerWritableStream<DeployFuncRequest, DeployStream>
  ) {
    try {
      assertValidFuncName(call.request.getName());
      assertValidSchedule(call.request.getSchedule());
      const serverStream = new ServerStream(call);
      serverStream.write("starting deployment");
      await publish(call, serverStream);
      serverStream.write("deployment complete");
      serverStream.write("your function will be available shortly");
      call.end();
    } catch (e) {
      logger.error(`@fonoster/funcs deploy [${e}]`);

      if (!e.response) {
        call.emit("error", new FonosterError(e, ErrorCodes.UNKNOWN));
        return;
      }

      if (e.response.statusCode === 400) {
        call.emit(
          "error",
          new FonosterError(e.response.body, ErrorCodes.INVALID_ARGUMENT)
        );
      } else if (e.response.statusCode === 401) {
        call.emit(
          "error",
          new FonosterSubsysUnavailable("Functions subsystem unavailable")
        );
      } else if (e.response.statusCode === 404) {
        call.emit(
          "error",
          new FonosterError(e.response.body, ErrorCodes.NOT_FOUND)
        );
      }
    }
  }

  // See client-side for comments
  async deleteFunc(
    call: grpc.ServerUnaryCall<DeleteFuncRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    const accessKeyId = getAccessKeyId(call);
    const functionName = getFuncName(accessKeyId, call.request.getName());
    try {
      await faas.systemFunctionsDelete({ functionName });
      callback(null, new Empty());
    } catch (e) {
      logger.error(`@fonoster/funcs delete [${e}]`);
      if (e.response.statusCode === 404) {
        callback(
          new FonosterError(
            `Function name "${call.request.getName()}" doesn't exist`,
            ErrorCodes.NOT_FOUND
          ),
          null
        );
      }
      callback(e, null);
    }
  }

  // See client-side for comments
  // TODO: Resign with JWT token
  async getFuncLogs(call: ServerWritableStream<GetFuncLogsRequest, FuncLog>) {
    try {
      const accessKeyId = getAccessKeyId(call);
      const functionName = getFuncName(accessKeyId, call.request.getName());
      const stream = request
        .get(
          `${
            faas.basePath
          }/system/logs?name=${functionName}&since=${call.request.getSince()}&tail=${call.request.getTail()}&follow=${call.request.getFollow()}`,
          {
            auth: {
              user: process.env.FUNCS_USERNAME,
              pass: process.env.FUNCS_SECRET,
              sendImmediately: false
            }
          }
        )
        .on("response", function (res) {
          if (res.statusCode === 200) {
            stream.pipe(ndjson.parse()).on("data", (data) => {
              const entry = new FuncLog();
              entry.setName(data.name);
              entry.setTimestamp(data.timestamp);
              entry.setInstance(data.instance);
              entry.setText(data.text);
              call.write(entry);
            });
          }
        })
        .on("error", (e) => {
          logger.error(
            `@fonoster/funcs system logs [error while receiving data: ${e}]`
          );
          call.end();
        })
        .on("end", () => {
          logger.verbose("@fonoster/funcs system logs [done receiving data]");
          call.end();
        });
    } catch (e) {
      logger.error(`@fonoster/funcs deploy [${e}]`);
      if (e.response.statusCode === 400) {
        call.emit(
          "error",
          new FonosterError(e.response.body, ErrorCodes.INVALID_ARGUMENT)
        );
      } else if (e.response.statusCode === 401) {
        call.emit(
          "error",
          new FonosterSubsysUnavailable("Functions subsystem unavailable")
        );
      } else if (e.response.statusCode === 404) {
        call.emit(
          "error",
          new FonosterError(e.response.body, ErrorCodes.NOT_FOUND)
        );
      }
      call.emit("error", new FonosterError(e, ErrorCodes.NOT_FOUND));
    }
  }

  /**
   * @deprecated
   *
   * This function creates a single use, scoped token, useful for pushing images
   * to a private Docker registry.
   */
  async createRegistryToken(
    call: grpc.ServerUnaryCall<
      CreateRegistryTokenRequest,
      CreateRegistryTokenResponse
    >,
    callback: grpc.sendUnaryData<CreateRegistryTokenResponse>
  ) {
    try {
      if (!call.request.getFuncName())
        throw new FonosterError(
          "Missing function name",
          ErrorCodes.INVALID_ARGUMENT
        );
      const endpoint = process.env.DOCKER_REGISTRY_AUTH_ENDPOINT;
      const service = process.env.DOCKER_REGISTRY_SERVICE;
      const auth = btoa(
        `${process.env.DOCKER_REGISTRY_USERNAME}:${process.env.DOCKER_REGISTRY_SECRET}`
      );
      const accessKeyId = getAccessKeyId(call);
      const image = getImageName(accessKeyId, call.request.getFuncName());
      const baseURL = `${endpoint}?service=${service}&scope=repository:${image}:push`;
      const result = await axios
        .create({
          headers: { Authorization: `Basic ${auth}` }
        })
        .get(baseURL);
      const token = result.data.token;
      const res = new CreateRegistryTokenResponse();
      res.setToken(token);
      res.setImage(image);
      callback(null, res);
    } catch (e) {
      callback(new FonosterError(e), null);
    }
  }
}

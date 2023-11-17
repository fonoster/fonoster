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
import FuncsPB, { Func } from "../service/protos/funcs_pb";
import { DeployFuncRequest, FuncParameters } from "../client/types";
import fs from "fs-extra";
import path from "path";
import tar from "tar";
import { FonosterError, ErrorCodes } from "@fonoster/errors";
import cron from "cron-validate";
import createAccessKeySecret from "./auth";
import { FunctionDefinition } from "openfaas-client";

export const buildDeployFuncRequest = (request: DeployFuncRequest) => {
  const limits = new FuncsPB.Resource();
  const requests = new FuncsPB.Resource();

  if (request.limits) {
    limits.setCpu(request.limits.cpu);
    limits.setMemory(request.limits.memory);
  }

  if (request.requests) {
    requests.setCpu(request.requests.cpu);
    requests.setMemory(request.requests.memory);
  }

  const dfr = new FuncsPB.DeployFuncRequest();
  dfr.setName(request.name);
  dfr.setLimits(limits);
  dfr.setRequests(requests);
  dfr.setSchedule(request.schedule);
  return dfr;
};

export const assertValidFuncName = (name: string) => {
  if (/[^a-z0-9_]/.test(name))
    throw new FonosterError(
      "function name must be a-z0-9_",
      ErrorCodes.INVALID_ARGUMENT
    );
};

export const assertValidSchedule = (schedule: string) => {
  if (schedule && !cron(schedule).isValid()) {
    throw new FonosterError(
      "function schedule is not valid (invalid cron expression)",
      ErrorCodes.INVALID_ARGUMENT
    );
  }
};

// @deprecated
export const validateFunc = (pathToFunc: string) => {
  const packagePath = path.join(pathToFunc, "package.json");
  let pInfo;

  // Expects an existing valid package.json
  const packageInfo = (p: string) => JSON.parse(`${fs.readFileSync(p)}`);

  try {
    pInfo = packageInfo(packagePath);
  } catch (err) {
    throw new Error(
      `Unable to obtain function info. Ensure package.json exists in '${pathToFunc}', and that is well formatted`
    );
  }

  if (!pInfo.main) throw new Error('Missing "main" entry at package.json');

  const mainScript = `${pathToFunc}/${pInfo.main}`;

  if (!fs.existsSync(mainScript))
    throw new Error(`Cannot find main script at "${mainScript}"`);

  if (!fs.existsSync(pathToFunc) || !fs.lstatSync(pathToFunc).isDirectory()) {
    throw new Error(`${pathToFunc} does not exist or is not a directory`);
  }

  if (!fs.existsSync(packagePath)) {
    throw new Error(`not package.json found in ${pathToFunc}`);
  }
};

export const cleanupTmpDirSync = (dirName: string) => {
  if (fs.existsSync(`/tmp/${dirName}`))
    fs.rmdirSync(`/tmp/${dirName}`, { recursive: true });
  if (fs.existsSync(`/tmp/${dirName}.tgz`))
    fs.unlinkSync(`/tmp/${dirName}.tgz`);
};

export const copyFuncAtTmp = async (funcPath: string, dirName: string) => {
  await fs.copy(funcPath, `/tmp/${dirName}`, {
    filter: (currentPath) => !currentPath.includes("node_modules")
  });
  await tar.create({ file: `/tmp/${dirName}.tgz`, cwd: "/tmp" }, [dirName]);
};

export const getFuncName = (accessKeyId: string, name: string) =>
  `fn${accessKeyId}${name}`;

export const getImageName = (accessKeyId: string, name: string) =>
  `${process.env.DOCKER_REGISTRY_ORG}/fn${accessKeyId}${name}`;

export const getBuildDir = (accessKeyId: string, funcName: string) =>
  process.env.NODE_ENV === "dev"
    ? "/tmp/example"
    : path.join(process.env.FUNCS_WORKDIR, accessKeyId, funcName);

export const buildFaasDeployParameters = async (params: FuncParameters) => {
  const endpoint = process.env.PUBLIC_URL.replace("http://", "").replace(
    "https://",
    ""
  );

  const parameters: FunctionDefinition = {
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
    envProcess: undefined,
    labels: {
      funcName: params.request.getName()
    },
    envVars: {
      ACCESS_KEY_ID: params.accessKeyId,
      ACCESS_KEY_SECRET: await createAccessKeySecret(params.accessKeyId),
      APISERVER_ENDPOINT: endpoint
    },
    annotations: {
      topic: undefined,
      schedule: undefined
    }
  };
  const limits = params.request.getLimits();
  const requests = params.request.getRequests();

  if (params.request.getSchedule()) {
    parameters.annotations = {
      topic: "cron-function",
      schedule: params.request.getSchedule()
    };
  }
  if (limits && limits.getMemory())
    parameters.limits.memory = limits.getMemory();
  if (limits && limits.getCpu()) parameters.limits.cpu = limits.getCpu();
  if (requests && requests.getMemory())
    parameters.requests.memory = requests.getMemory();
  if (requests && requests.getCpu())
    parameters.requests.cpu = requests.getCpu();

  return parameters;
};

export const rawFuncToFunc = (rawFunc: any) => {
  const func = new Func();
  func.setName(rawFunc.labels.funcName);
  func.setImage(rawFunc.image);
  func.setInvocationCount(rawFunc.invocationCount);
  func.setReplicas(rawFunc.replicas);
  func.setAvailableReplicas(rawFunc.availableReplicas);
  if (rawFunc.annotations && rawFunc.annotations.schedule) {
    func.setSchedule(rawFunc.annotations.schedule);
  }
  return func;
};

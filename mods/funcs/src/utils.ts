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
import FuncsPB from "./service/protos/funcs_pb";
import {DeployFuncRequest} from "./types";
import fs from "fs-extra";
import path from "path";
import tar from "tar";

export const buildCreateFuncRequest = (request: DeployFuncRequest) => {
  const limits = new FuncsPB.Resource();
  limits.setCpu(request.limits.cpu);
  limits.setMemory(request.limits.memory);

  const requests = new FuncsPB.Resource();
  requests.setCpu(request.requests.cpu);
  requests.setMemory(request.requests.memory);

  const cfr = new FuncsPB.CreateFuncRequest();
  cfr.setName(request.name);
  cfr.setBaseImage(request.baseImage);
  cfr.setLimits(limits);
  cfr.setRequests(requests);
  return cfr;
};

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

export const cleanupTmpDir = (dirName: string) => {
  if (fs.existsSync(`/tmp/${dirName}`))
    fs.rmdirSync(`/tmp/${dirName}`, {recursive: true});
  if (fs.existsSync(`/tmp/${dirName}.tgz`)) fs.unlink(`/tmp/${dirName}.tgz`);
};

export const copyFuncAtTmp = async (funcPath: string, dirName: string) => {
  await fs.copy(funcPath, `/tmp/${dirName}`);
  await tar.create({file: `/tmp/${dirName}.tgz`, cwd: "/tmp"}, [dirName]);
};

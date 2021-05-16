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
import {Image} from "container-image-builder";
import {ErrorCodes, FonosError} from "@fonos/errors";
import fs from "fs";
import logger from "@fonos/logger";

export interface BuildInfo {
  baseImage: string;
  image: string;
  pathToFunc: string;
  registry: string;
  username?: string;
  secret?: string;
  token?: string;
}

function getAuth(request) {
  logger.verbose(
    `@fonos/funcs image build [constructing auth obj for ${request.registry}]`
  );
  let credentials = {};
  if (request.username) {
    credentials = {
      Username: request.username,
      Secret: request.secret
    };
  } else if (request.token) {
    credentials = {
      token: request.token
    };
  }
  const authObj = {auth: {}};
  authObj.auth[request.registry] = credentials;
  logger.verbose(
    `@fonos/funcs image build [auth obj is = ${JSON.stringify(authObj)}]`
  );
  return authObj;
}

// Push image function
export default async function (request: BuildInfo) {
  logger.debug(
    `@fonos/funcs image build [starting image build for ${request.image}]`
  );
  logger.verbose(
    `@fonos/funcs image build [base image is = ${request.baseImage}]`
  );
  logger.verbose(
    `@fonos/funcs image build [inspecting path to func ${request.pathToFunc}]`
  );

  if (!fs.existsSync(request.pathToFunc)) {
    throw new FonosError(`path ${request.pathToFunc} does not exist`);
  }

  const image = new Image(
    request.baseImage,
    `index.${request.registry}/${request.image}`,
    getAuth(request)
  );

  logger.verbose(
    `@fonos/funcs image build [pushing image to registry ${request.registry}]`
  );

  try {
    const result = await image.save();
    logger.verbose(
      `@fonos/funcs image build [pushed image, result = ${JSON.stringify(
        result
      )}]`
    );
    return;
  } catch (e) {
    logger.error(`@fonos/funcs image build [${e}]`);
    if (e.message.includes("no auth handler for"))
      throw new FonosError(
        "failed to find image, be sure to add full repo path (i.e docker.io/repo/image)",
        ErrorCodes.INVALID_ARGUMENT
      );
  }
  throw new FonosError(
    `Unable to pulish image ${request.image} to registry ${request.registry}`,
    ErrorCodes.UNKNOWN
  );
}

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
import Docker from "dockerode";
import fs from "fs";
import logger from "@fonos/logger";
import {ServerStream} from "./funcs";
import {FonosError} from "@fonos/errors";

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
  return {
    username: request.username,
    password: request.secret,
    serveraddress: "https://index.docker.io/v1"
  };
}

// Push image function
export default async function (request: BuildInfo, serverStream: ServerStream) {
  serverStream.write(`getting base image ${request.baseImage}`);
  serverStream.write("connecting to the builder daemon");

  const docker = new Docker({socketPath: "/var/run/docker.sock"});

  serverStream.write(`setting destination image to ${request.image}]`);

  serverStream.write(
    `checking path to func... has function? ${fs.existsSync(
      request.pathToFunc
    )}`
  );

  serverStream.write("obtaining authentication handler");
  const auth = getAuth(request);
  const files = ["Dockerfile", "index.js", "package.json"];
  if (fs.existsSync(request.pathToFunc)) {
    serverStream.write(`adding ${request.pathToFunc} into workdir (/home/app)`);
    // files.push('')
  }

  serverStream.write(
    `preparing image for publishing on ${request.registry} registry`
  );

  try {
    const stream = await docker.buildImage(
      {
        context: request.pathToFunc,
        src: files
      },
      {t: request.image}
    );

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });

    serverStream.write("build complete");
    const image = docker.getImage(request.image);

    const stream2 = await image.push({
      tag: "latest",
      authconfig: getAuth(request)
    });
    stream2.pipe(process.stdout);

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream2, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
  } catch (e) {
    logger.error(JSON.stringify(e));
    throw new FonosError(
      `Unable to pulish image ${request.image} to registry ${request.registry}`
    );
  }
}

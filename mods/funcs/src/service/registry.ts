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
import Docker from "dockerode";
import fs from "fs";
import logger from "@fonoster/logger";
import { ServerStream } from "./funcs";
import { FonosterError } from "@fonoster/errors";
import walk from "walk";
import { promisify } from "util";

const sleep = promisify(setTimeout);

export interface BuildInfo {
  image: string;
  pathToFunc: string;
  registry: string;
  username?: string;
  secret?: string;
  token?: string;
}

const getAuth = (request: BuildInfo) => {
  logger.verbose(
    `@fonoster/funcs image build [constructing auth obj for ${request.registry}]`
  );
  return {
    username: request.username,
    password: request.secret,
    serveraddress: "https://index.docker.io/v1"
  };
};

const ls = (pathToFunc: string): Promise<string[]> => {
  const walker = walk.walk(pathToFunc);
  const files = [];

  return new Promise((resolve, reject) => {
    walker.on(
      "file",
      (root: string, stats: { name: string }, next: () => void) => {
        let base = root.substring(pathToFunc.length + 1);
        base = base.length > 0 ? base + "/" : "";
        const file = base + stats.name;

        logger.verbose(
          `@fonoster/storage walk [base = ${base}, name = ${stats.name}]`
        );

        files.push(file);
        next();
      }
    );

    walker.on("errors", (e: any) => {
      reject(e);
    });

    walker.on("end", () => {
      logger.verbose(`@fonoster/storage walk [finished walking ${pathToFunc}]`);
      logger.verbose(`@fonoster/funcs walk [ files = ${files}`);
      resolve(files);
    });
  });
};

// Push image function
export default async function (request: BuildInfo, serverStream: ServerStream) {
  const attempts = [1, 2, 3];
  let index;
  for (index in attempts) {
    // Sometime the image is not inmediatly available so we try a few times
    logger.verbose(
      `@fonoster/funcs publish [waiting for files to be ready (try #${attempts[index]})`
    );

    logger.verbose(
      `@fonoster/funcs registry [is file ${
        request.pathToFunc
      } present? ${fs.existsSync(request.pathToFunc)}`
    );

    if (fs.existsSync(request.pathToFunc)) {
      break;
    } else {
      // Wait for 10 seconds for minio to be ready
      await sleep(10000);
    }
  }

  const files = await ls(request.pathToFunc);

  serverStream.write("loaded function files");
  serverStream.write("connecting to the builder daemon");
  serverStream.write("sending files to builder daemon");
  serverStream.write("building image");
  serverStream.write("required function keys added");

  const docker = new Docker({ socketPath: "/var/run/docker.sock" });
  try {
    const stream = await docker.buildImage(
      {
        context: request.pathToFunc,
        src: files
      },
      { t: request.image }
    );

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });

    serverStream.write("build complete");
    const image = docker.getImage(request.image);

    serverStream.write("obtaining authentication handler");
    const auth = getAuth(request);

    const stream2 = await image.push({
      tag: "latest",
      authconfig: auth
    });

    await new Promise((resolve, reject) => {
      docker.modem.followProgress(stream2, (err, res) =>
        err ? reject(err) : resolve(res)
      );
    });
  } catch (e) {
    logger.error(JSON.stringify(e));
    throw new FonosterError(
      `Unable to pulish image ${request.image} to registry ${request.registry}`
    );
  } finally {
    // Clean all the files
    fs.rmdirSync(request.pathToFunc, { recursive: true });
  }
}

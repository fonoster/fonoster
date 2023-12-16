/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import * as grpc from "@grpc/grpc-js";
import * as os from "os";
import * as fs from "fs";
import { getLogger } from "@fonoster/logger";
import path from "path";
import atob from "atob";
import { GRPC_ALLOW_INSECURE } from "./envs";

const prepCert = (cert: string) => Buffer.from(atob(cert), "utf-8");
const logger = getLogger({ service: "common", filePath: __filename });

let config: {
  caCertificate?: string;
  serverCertificate?: string;
  serverKey?: string;
  clientCertificate?: string;
  clientKey?: string;
} = {};

try {
  config = JSON.parse(
    fs
      .readFileSync(path.join(os.homedir(), ".fonoster", "config"))
      .toString("utf-8")
  );
} catch (e) {
  logger.verbose(
    "no config found at " + path.join(os.homedir(), ".fonoster", "config")
  );
}

const getServerCredentials = () => {
  try {
    return grpc.ServerCredentials.createSsl(
      prepCert(config.caCertificate),
      [
        {
          cert_chain: prepCert(config.serverCertificate),
          private_key: prepCert(config.serverKey)
        }
      ],
      true
    );
  } catch (e) {
    logger.info("unable to load security certificates");
    logger.info("starting server in insecure mode");
    return grpc.ServerCredentials.createInsecure();
  }
};

const getClientCredentials = () =>
  GRPC_ALLOW_INSECURE === "true"
    ? grpc.credentials.createInsecure()
    : grpc.credentials.createSsl();

export { getClientCredentials, getServerCredentials };

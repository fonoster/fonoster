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
import logger from "@fonos/logger";
import path from "path";
import * as os from "os";
import * as fs from "fs";
import atob from "atob";
import grpc from "grpc";

const prepCert = (cert: string) => Buffer.from(atob(cert), "utf-8");

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
      .readFileSync(path.join(os.homedir(), ".fonos", "config"))
      .toString("utf-8")
  );
} catch (e) {
  logger.verbose("@fonos/common no config found");
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
    logger.warn(
      "@fonos/common trust util [unable to load security certificates]"
    );
    logger.warn("@fonos/common trust util [starting server in insecure mode]");
    return grpc.ServerCredentials.createInsecure();
  }
};

const getClientCredentials = (grpc) => {
  try {
    return grpc.credentials.createSsl(
      prepCert(config.caCertificate),
      prepCert(config.clientKey),
      prepCert(config.clientCertificate)
    );
  } catch (e) {
    logger.log(
      "warn",
      "@fonos/common trust util [unable to load security certificates]"
    );
    logger.log(
      "warn",
      "@fonos/common trust util [starting server in insecure mode]"
    );
    return grpc.credentials.createInsecure();
  }
};

export {getClientCredentials, getServerCredentials};

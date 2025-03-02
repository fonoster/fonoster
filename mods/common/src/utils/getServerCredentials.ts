/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import * as fs from "fs";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";

const logger = getLogger({ service: "common", filePath: __filename });

type CredentialsConfig = {
  tlsOn?: boolean;
  verifyClientCert?: boolean;
  caCert?: string;
  serverCert?: string;
  serverKey?: string;
};

async function getServerCredentials(config: CredentialsConfig) {
  const { tlsOn, verifyClientCert, caCert, serverCert, serverKey } = config;

  logger.verbose("get server credentials", {
    tlsOn,
    verifyClientCert,
    caCert,
    serverCert,
    serverKey
  });

  if (tlsOn) {
    const cacert = verifyClientCert ? fs.readFileSync(caCert) : null;

    return grpc.ServerCredentials.createSsl(cacert, [
      {
        private_key: await fs.promises.readFile(serverKey),
        cert_chain: await fs.promises.readFile(serverCert)
      }
    ]);
  }

  return grpc.ServerCredentials.createInsecure();
}

export { CredentialsConfig, getServerCredentials };

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
} catch (e) {}

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
    logger.log(
      "warn",
      "Unable to load security certificates. Starting server in Insecure mode"
    );
    return grpc.ServerCredentials.createInsecure();
  }
};

const getClientCredentials = (grpc?) => {
  try {
    return grpc.credentials.createSsl(
      prepCert(config.caCertificate),
      prepCert(config.clientKey),
      prepCert(config.clientCertificate)
    );
  } catch (e) {
    logger.log(
      "warn",
      "Unable to load security certificates. Starting client in Insecure mode"
    );
    return grpc.credentials.createInsecure();
  }
};

export {getClientCredentials, getServerCredentials};

/* eslint-disable require-jsdoc */
import logger from "@fonos/logger";
import * as grpc from "grpc";
import {
  HealthCheckRequest,
  HealthCheckResponse,
  HealthClient
} from "grpc-ts-health-check";

const host = process.env.SERVICE_ADDRESS || "localhost";
const port = parseInt(process.env.SERVICE_PORT) || 50052;
const service = process.env.SERVICE_NAME || "";

export default function (): void {
  const healthClient = new HealthClient(
    `${host}:${port}`,
    grpc.credentials.createInsecure()
  );
  const request = new HealthCheckRequest();
  request.setService(service);
  healthClient.check(
    request,
    (error: Error | null, response: HealthCheckResponse) => {
      if (error) {
        logger.error(`@fonos/common healthcheck fialed: ${error}`, error);
        process.exit(1);
      } else {
        logger.verbose(
          `@fonos/common healthcheck success [status: ${response.getStatus()}]`
        );
        process.exit(0);
      }
    }
  );
}

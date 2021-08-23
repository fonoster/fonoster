import logger from "@fonos/logger";
const register = require("../../../etc/service_envs.json");

export default function assertEnvIsSet(name: string) {
  const services = register.filter((service: any) => service.module === name);
  for (let value of services) {
    value.env.forEach(function (variable: string) {
      if (!(variable in process.env)) {
        logger.error(
          `The environment variable ${variable} is required but was not found`
        );
        process.exit(1);
      }
    });
  }
}
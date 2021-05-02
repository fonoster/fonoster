import Numbers from "@fonos/numbers";
import logger from "@fonos/logger";

export default function (extension: string) {
  // We check for a handler, and return default none exist
  try {
    const numbers = new Numbers();
    const app = numbers.getIngressAppSync({e164Number: extension});
    const appsDirBase = process.env.APPS_DIR || "/home/fonos/apps";
    const appsDir = `${appsDirBase}/${app.accessKeyId}`;
    const packageBase = `${appsDir}/${app.ref}`;
    const pathToManifest = `${packageBase}/package.json`;

    try {
      const entryPoint = require(pathToManifest).main;
      return {
        entryPoint: `${packageBase}/${entryPoint}`,
        accessKeyId: app.accessKeyId
      };
    } catch (e) {
      // TODO: This must distinguish between malformed, non-existent, and non-access errors
      logger.log(
        "error",
        `@fonos/dispatcher [unable find entry point. Ensure that path '${pathToManifest}' exist and has the correct permissions.`
      );
    }
  } catch (e) {
    logger.log(
      "error",
      `@fonos/dispatcher getIngressInfo [could not find handler for ext '${extension}']`
    );
  }
}

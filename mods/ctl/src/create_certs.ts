import {cli} from "cli-ux";
import {CLIError} from "@oclif/errors";
const Docker = require("dockerode");

const getConfig = (subject?: string, name?: string, accessKeyId?: string) => {
  return {
    Volumes: {
      "/certs": {}
    },
    Hostconfig: {
      Binds: ["/tmp/certs:/certs"]
    },
    Env: [
      `SUBJECT=${subject}`,
      `CERT_NAME=${name}`,
      `ACCESS_KEY_ID=${accessKeyId}`,
      `ISS=${accessKeyId}`
    ]
  };
};

export default async function (subject: string, accessKeyId: string) {
  try {
    cli.log("Pulling docker images");

    const docker = new Docker();

    try {
      await docker.ping();
    } catch (e) {
      throw new Error("Unable to connect to docker engine");
    }

    try {
      await docker.pull("fonoster/jwthelper");
      await docker.pull("fonoster/certshelper");
    } catch (e) {
      throw new Error("Failed to pull docker images");
    }

    cli.log("Creating jwt token");

    await docker.run(
      "fonoster/jwthelper",
      [],
      null,
      getConfig(null, null, accessKeyId)
    );

    cli.log("Creating client certificates");

    await docker.run(
      "fonoster/certshelper",
      [],
      null,
      getConfig(subject, "client")
    );

    cli.log("Creating server certificates ");

    await docker.run(
      "fonoster/certshelper",
      [],
      null,
      getConfig(subject, "server")
    );
  } catch (e) {
    throw new CLIError(e.message);
  }
}

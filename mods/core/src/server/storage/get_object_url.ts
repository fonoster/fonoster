import logger from "@fonos/logger";
import grpc from "grpc";
import {FonosError} from "@fonos/errors";
import {fsInstance} from "../../common/utils";

export default async function (
  accessKeyId: string,
  bucket: string,
  filename: string
): Promise<string> {
  logger.log(
    "debug",
    `@fonos/core getObjectURL [bucket: ${bucket}, filename: ${filename}, accessKeId: ${accessKeyId}}]`
  );

  return new Promise((resolve, reject) => {
    fsInstance().statObject(
      bucket,
      `${accessKeyId}/${filename}`,
      (err: {message: string}) => {
        if (err) {
          reject(
            new FonosError(
              `${err.message}: filename ${accessKeyId}/${filename} in bucket '${bucket}'`,
              grpc.status.NOT_FOUND
            )
          );
          return;
        }
        resolve(
          `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${accessKeyId}/${filename}`
        );
      }
    );
  });
}

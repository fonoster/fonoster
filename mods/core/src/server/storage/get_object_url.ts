import logger from '@fonos/logger'
import grpc from 'grpc'
import { FonosError } from '@fonos/errors'
import { fsInstance } from '../../common/utils'

export default async function (bucket: string, filename: string): Promise<string> {
  logger.log(
    'debug',
    `@fonos/core getObjectURL [bucket: ${bucket}, filename: ${filename}}]`
  )

  return new Promise((resolve, reject) => {
    fsInstance().statObject(bucket, filename, (err: { message: string }) => {
      if (err) {
        reject(new FonosError(
          `${err.message}: filename '${filename}' in bucket '${bucket}'`,
          grpc.status.NOT_FOUND
        ))
        return
      }
      resolve(
        `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${filename}`
      )
    })
  })
}

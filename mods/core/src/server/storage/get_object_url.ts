import logger from '@fonos/logger'
import grpc from 'grpc'
import { FonosError } from '@fonos/errors'
import { fsInstance } from '../../common/utils'

export default async function (bucket: string, name: string): Promise<string> {
  logger.log(
    'debug',
    `@fonos/core getObjectURL [bucket: ${bucket}, filename: ${name}}]`
  )

  return new Promise((resolve, reject) => {
    fsInstance().statObject(bucket, name, (err: { message: string }) => {
      if (err) {
        const fonosError = new FonosError(
          `${err.message}: filename '${name}' in bucket '${bucket}'`,
          grpc.status.NOT_FOUND
        )
        reject(fonosError)
        return
      }
      resolve(
        `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${name}`
      )
    })
  })
}

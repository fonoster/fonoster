import logger from '@fonos/logger'
import grpc from 'grpc'
import { FonosError } from '@fonos/errors'
import { fsInstance } from '../../common/utils'

export default function (bucket: string, name: string): string {
  logger.log(
    'debug',
    `@fonos/core getObjectURL [bucket: ${bucket}, filename: ${name}}]`
  )

  return fsInstance().statObject(bucket, name, (err: { message: string }) => {
    if (err) {
      throw new FonosError(
        `${err.message}: filename '${name}' in bucket '${bucket}'`,
        grpc.status.NOT_FOUND
      )
    }
    return `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${bucket}/${name}`
  })
}

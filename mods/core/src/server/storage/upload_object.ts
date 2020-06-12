import logger from '@fonos/logger'
import grpc from 'grpc'
import fs from 'fs'
import { FonosError, FonosFailedPrecondition } from '@fonos/errors'
import {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  mapToObj
} from '../../common/utils'
import { UploadObjectResponse } from '../protos/storage_pb'

export default async function (call: any, callback: any) {
  const objectid = require('objectid')
  const tmpName = objectid()
  const writeStream = fs.createWriteStream(`/tmp/${tmpName}`)
  let object: string
  let bucket: any
  let metadata: any

  call.on('error', (err: any) => logger.log('error', err))
  call.on('end', () => writeStream.end())

  call.on('data', (request: any) => {
    object = request.getName()
    bucket = request.getBucket()
    metadata = mapToObj(request.getMetadataMap())
    const chunk = request.getChunks()
    writeStream.write(Buffer.alloc(chunk.length, chunk))
  })

  writeStream.on('finish', async () => {
    try {
      logger.log(
        'verbose',
        `@fonos/core uploadObject [object ready for upload]`
      )
      logger.log('debug', `@fonos/core uploadObject [object: ${object}]`)
      logger.log('debug', `@fonos/core uploadObject [bucket: ${bucket}]`)
      logger.log(
        'debug',
        `@fonos/core uploadObject [metadata: ${JSON.stringify(metadata)}]`
      )

      const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`)
      logger.log('debug', `@fonos/core uploadObject [file size -> ${fileSize}]`)

      // Back to what it is supposed to be
      fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`)

      // Unzip file if needed
      if (
        object.endsWith('.zip') ||
        object.endsWith('.tar') ||
        object.endsWith('.tgz') ||
        object.endsWith('.tar.gz')
      ) {
        logger.log(
          'verbose',
          `@fonos/core uploadObject [extracting files: /tmp/${object}]`
        )
        await extract(`/tmp/${object}`, `/tmp`)

        const nameWithoutExt = object.split('.')[0]
        // Upload to fs
        await uploadToFS(bucket, `/tmp/${nameWithoutExt}`)

        // Removing extracted dir
        removeDirSync(`/tmp/${nameWithoutExt}`)

        const response = new UploadObjectResponse()
        response.setSize(fileSize)
        callback(null, response)
      } else {
        // Upload to fs
        await uploadToFS(bucket, `/tmp/${object}`, object)
        const response = new UploadObjectResponse()
        response.setSize(fileSize)
        callback(null, response)
      }

      // Remove temporal file
      logger.log(
        'verbose',
        `@fonos/core uploadObject [removing tmpfile: /tmp/${object}}]`
      )
      fs.unlinkSync(`/tmp/${object}`)
    } catch (err) {
      if (err.code === 'NoSuchBucket') {
        logger.log('error', `${err.message} -> bucket: ${bucket}`)
        callback(
          new FonosFailedPrecondition(`${err.message} -> bucket: ${bucket}`)
        )
      } else if (err.code === 'TAR_BAD_ARCHIVE') {
        logger.log('error', err.message)
        callback(new FonosError(err.message, grpc.status.DATA_LOSS))
      } else {
        logger.log('error', err.message)
        callback(new FonosError(err.message, grpc.status.UNKNOWN))
      }
    }
  })
}

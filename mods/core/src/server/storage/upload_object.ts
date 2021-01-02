import logger from '@fonos/logger'
import grpc from 'grpc'
import fs from 'fs'
import { FonosError, FonosFailedPrecondition } from '@fonos/errors'
import {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes
} from '../../common/utils'
import { UploadObjectResponse } from '../protos/storage_pb'

const objectid = require('objectid')
const isCompressFile = (object: string) =>
  object.endsWith('.zip') ||
  object.endsWith('.tar') ||
  object.endsWith('.tgz') ||
  object.endsWith('.tar.gz')
const handleError = (err: { code: any; message: string }, bucket: string) => {
  switch (err.code) {
    case 'NoSuchBucket':
      return new FonosFailedPrecondition(`${err.message} -> bucket: ${bucket}`)
    case 'TAR_BAD_ARCHIVE':
      return new FonosError(err.message, grpc.status.DATA_LOSS)
    default:
      return new FonosError(err.message, grpc.status.UNKNOWN)
  }
}

const handleCompressUpload = async (
  object: string,
  bucket: string,
  fileSize: number
) => {
  await extract(`/tmp/${object}`, `/tmp`)
  const nameWithoutExt = object.split('.')[0]
  await uploadToFS(bucket, `/tmp/${nameWithoutExt}`)
  removeDirSync(`/tmp/${nameWithoutExt}`)
  const response = new UploadObjectResponse()
  response.setSize(fileSize)
  return response
}

const handleUncompressUpload = async (
  object: string,
  bucket: string,
  fileSize: number
) => {
  await uploadToFS(bucket, `/tmp/${object}`, object)
  const response = new UploadObjectResponse()
  response.setSize(fileSize)
  return response
}

export default async function (call: any, callback: any) {
  const tmpName = objectid(),
    writeStream = fs.createWriteStream(`/tmp/${tmpName}`)
  let object: string, bucket: any, metadata: any

  call.on('error', (err: any) => logger.log('error', err))
  call.on('end', () => writeStream.end())
  call.on('data', (request: any) => {
    const chunk = request.getChunks()
    writeStream.write(Buffer.alloc(chunk.length, chunk))
    object = request.getName()
    bucket = request.getBucket()
    // removed useless assignment
    // metadata = mapToObj(request.getMetadataMap()) // ??
  })

  writeStream.on('finish', async () => {
    try {
      const fileSize = getFilesizeInBytes(`/tmp/${tmpName}`)
      fs.renameSync(`/tmp/${tmpName}`, `/tmp/${object}`)
      const response = isCompressFile(object)
        ? await handleCompressUpload(object, bucket, fileSize)
        : await handleUncompressUpload(object, bucket, fileSize)

      callback(null, response)
      fs.unlinkSync(`/tmp/${object}`)
    } catch (err) {
      callback(handleError(err, bucket))
    }
  })
}

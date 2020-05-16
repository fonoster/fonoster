'use strict'
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt (value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value)
          })
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled (value) {
        try {
          step(generator.next(value))
        } catch (e) {
          reject(e)
        }
      }
      function rejected (value) {
        try {
          step(generator['throw'](value))
        } catch (e) {
          reject(e)
        }
      }
      function step (result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected)
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next())
    })
  }
Object.defineProperty(exports, '__esModule', { value: true })
const StoragePB = require('./protos/storage_pb')
const {
  FonosError,
  FonosAuthError,
  FonosFailedPrecondition,
  FonosInvalidArgument
} = require('@fonos/errors')
const grpc = require('grpc')
const objectid = require('objectid')
const fs = require('fs')
const storageValidator = require('../schemas/storage.schema')
const logger = require('../common/logger')
const { auth } = require('../common/trust_util')
const {
  extract,
  removeDirSync,
  uploadToFS,
  getFilesizeInBytes,
  mapToObj,
  fsInstance
} = require('../common/utils')
const uploadObject = (call, callback) => {
  if (!auth(call)) return callback(new FonosAuthError())
  // I swear I don't like this :(
  const delayVerification = request => {
    logger.log('verbose', `@fonos/core uploadObject [delay verification]`)
    // Validating the request
    const errors = storageValidator.uploadObjectRequest.validate({
      name: request.getName(),
      bucket: request.getBucket()
    })
    if (errors.length > 0) {
      logger.log('warn', `@fonos/core uploadObject [invalid argument]`)
      callback(new FonosInvalidArgument(errors[0].message))
      return
    }
  }
  const tmpName = objectid()
  const writeStream = fs.createWriteStream(`/tmp/${tmpName}`)
  let object
  let bucket
  let metadata
  let verified = false
  call.on('data', request => {
    if (!verified) {
      delayVerification(request)
      object = request.getName()
      bucket = request.getBucket()
      metadata = mapToObj(request.getMetadataMap())
      verified = true
    }
    const chunk = request.getChunks()
    writeStream.write(Buffer.alloc(chunk.length, chunk))
  })
  call.on('error', err => {
    logger.log('error', err)
  })
  call.on('end', () => writeStream.end())
  writeStream.on('finish', chunk =>
    __awaiter(void 0, void 0, void 0, function * () {
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
        logger.log(
          'debug',
          `@fonos/core uploadObject [file size -> ${fileSize}]`
        )
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
          yield extract(`/tmp/${object}`, `/tmp`)
          const nameWithoutExt = object.split('.')[0]
          // Upload to fs
          yield uploadToFS(bucket, `/tmp/${nameWithoutExt}`)
          // Removing extracted dir
          removeDirSync(`/tmp/${nameWithoutExt}`, { recursive: true })
          const response = new StoragePB.UploadObjectResponse()
          response.setSize(fileSize)
          callback(null, response)
        } else {
          // Upload to fs
          yield uploadToFS(bucket, `/tmp/${object}`, object)
          const response = new StoragePB.UploadObjectResponse()
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
          callback(new FonosError(grpc.status.DATA_LOSS, err.message))
        } else {
          logger.log('error', err.message)
          callback(new FonosError(grpc.status.UNKNOWN, err.message))
        }
      }
    })
  )
}
const getObjectURL = (call, callback) => {
  logger.log(
    'debug',
    `@fonos/core getObjectURL [request: ${call.request.getName()}]`
  )
  // Validating the request
  const errors = storageValidator.getObjectURLRequest.validate({
    name: call.request.getName(),
    bucket: call.request.getBucket()
  })
  if (errors.length > 0) {
    logger.log('warn', `@fonos/core getObjectURL [invalid argument]`)
    callback(new FonosInvalidArgument(errors[0].message))
    return
  }
  fsInstance().statObject(
    call.request.getBucket(),
    call.request.getName(),
    (err, dataStream) => {
      const name = call.request.getName()
      const bucket = call.request.getBucket()
      if (err) {
        callback(
          new FonosError(
            grpc.status.NOT_FOUND,
            `${err.message}: filename '${name}' in bucket '${bucket}'`
          )
        )
        return
      }
      const url = `http://${process.env.FS_HOST}:${
        process.env.FS_PORT
      }/${bucket}/${name}`
      const response = new StoragePB.GetObjectURLResponse()
      response.setUrl(url)
      callback(null, response)
    }
  )
}
module.exports.uploadObject = uploadObject
module.exports.getObjectURL = getObjectURL
//# sourceMappingURL=storage_srv.js.map

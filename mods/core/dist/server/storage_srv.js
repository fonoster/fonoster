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
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1]
          return t[1]
        },
        trys: [],
        ops: []
      },
      f,
      y,
      t,
      g
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this
        }),
      g
    )
    function verb (n) {
      return function (v) {
        return step([n, v])
      }
    }
    function step (op) {
      if (f) throw new TypeError('Generator is already executing.')
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t
          if (((y = 0), t)) op = [op[0] & 2, t.value]
          switch (op[0]) {
            case 0:
            case 1:
              t = op
              break
            case 4:
              _.label++
              return { value: op[1], done: false }
            case 5:
              _.label++
              y = op[1]
              op = [0]
              continue
            case 7:
              op = _.ops.pop()
              _.trys.pop()
              continue
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0
                continue
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1]
                break
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1]
                t = op
                break
              }
              if (t && _.label < t[2]) {
                _.label = t[2]
                _.ops.push(op)
                break
              }
              if (t[2]) _.ops.pop()
              _.trys.pop()
              continue
          }
          op = body.call(thisArg, _)
        } catch (e) {
          op = [6, e]
          y = 0
        } finally {
          f = t = 0
        }
      if (op[0] & 5) throw op[1]
      return { value: op[0] ? op[1] : void 0, done: true }
    }
  }
var _this = this
var StoragePB = require('./protos/storage_pb')
var _a = require('@yaps/errors'),
  YAPSError = _a.YAPSError,
  YAPSAuthError = _a.YAPSAuthError,
  YAPSFailedPrecondition = _a.YAPSFailedPrecondition,
  YAPSInvalidArgument = _a.YAPSInvalidArgument
var grpc = require('grpc')
var objectid = require('objectid')
var fs = require('fs')
var storageValidator = require('../schemas/storage.schema')
var logger = require('../common/logger')
var auth = require('../common/trust_util').auth
var _b = require('../common/utils'),
  extract = _b.extract,
  removeDirSync = _b.removeDirSync,
  uploadToFS = _b.uploadToFS,
  getFilesizeInBytes = _b.getFilesizeInBytes,
  mapToObj = _b.mapToObj,
  fsInstance = _b.fsInstance
var uploadObject = function (call, callback) {
  if (!auth(call)) return callback(new YAPSAuthError())
  // I swear I don't like this :(
  var delayVerification = function (request) {
    logger.log('verbose', '@yaps/core uploadObject [delay verification]')
    // Validating the request
    var errors = storageValidator.uploadObjectRequest.validate({
      name: request.getName(),
      bucket: request.getBucket()
    })
    if (errors.length > 0) {
      logger.log('warn', '@yaps/core uploadObject [invalid argument]')
      callback(new YAPSInvalidArgument(errors[0].message))
      return
    }
  }
  var tmpName = objectid()
  var writeStream = fs.createWriteStream('/tmp/' + tmpName)
  var object
  var bucket
  var metadata
  var verified = false
  call.on('data', function (request) {
    if (!verified) {
      delayVerification(request)
      object = request.getName()
      bucket = request.getBucket()
      metadata = mapToObj(request.getMetadataMap())
      verified = true
    }
    var chunk = request.getChunks()
    writeStream.write(Buffer.alloc(chunk.length, chunk))
  })
  call.on('error', function (err) {
    logger.log('error', err)
  })
  call.on('end', function () {
    return writeStream.end()
  })
  writeStream.on('finish', function (chunk) {
    return __awaiter(_this, void 0, void 0, function () {
      var fileSize, nameWithoutExt, response, response, err_1
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 6, , 7])
            logger.log(
              'verbose',
              '@yaps/core uploadObject [object ready for upload]'
            )
            logger.log(
              'debug',
              '@yaps/core uploadObject [object: ' + object + ']'
            )
            logger.log(
              'debug',
              '@yaps/core uploadObject [bucket: ' + bucket + ']'
            )
            logger.log(
              'debug',
              '@yaps/core uploadObject [metadata: ' +
                JSON.stringify(metadata) +
                ']'
            )
            fileSize = getFilesizeInBytes('/tmp/' + tmpName)
            logger.log(
              'debug',
              '@yaps/core uploadObject [file size -> ' + fileSize + ']'
            )
            // Back to what it is supposed to be
            fs.renameSync('/tmp/' + tmpName, '/tmp/' + object)
            if (
              !(
                object.endsWith('.zip') ||
                object.endsWith('.tar') ||
                object.endsWith('.tgz') ||
                object.endsWith('.tar.gz')
              )
            )
              return [3 /*break*/, 3]
            logger.log(
              'verbose',
              '@yaps/core uploadObject [extracting files: /tmp/' + object + ']'
            )
            return [4 /*yield*/, extract('/tmp/' + object, '/tmp')]
          case 1:
            _a.sent()
            nameWithoutExt = object.split('.')[0]
            // Upload to fs
            return [
              4 /*yield*/,
              uploadToFS(bucket, '/tmp/' + nameWithoutExt)
              // Removing extracted dir
            ]
          case 2:
            // Upload to fs
            _a.sent()
            // Removing extracted dir
            removeDirSync('/tmp/' + nameWithoutExt, { recursive: true })
            response = new StoragePB.UploadObjectResponse()
            response.setSize(fileSize)
            callback(null, response)
            return [3 /*break*/, 5]
          case 3:
            // Upload to fs
            return [4 /*yield*/, uploadToFS(bucket, '/tmp/' + object, object)]
          case 4:
            // Upload to fs
            _a.sent()
            response = new StoragePB.UploadObjectResponse()
            response.setSize(fileSize)
            callback(null, response)
            _a.label = 5
          case 5:
            // Remove temporal file
            logger.log(
              'verbose',
              '@yaps/core uploadObject [removing tmpfile: /tmp/' + object + '}]'
            )
            fs.unlinkSync('/tmp/' + object)
            return [3 /*break*/, 7]
          case 6:
            err_1 = _a.sent()
            if (err_1.code === 'NoSuchBucket') {
              logger.log('error', err_1.message + ' -> bucket: ' + bucket)
              callback(
                new YAPSFailedPrecondition(
                  err_1.message + ' -> bucket: ' + bucket
                )
              )
            } else if (err_1.code === 'TAR_BAD_ARCHIVE') {
              logger.log('error', err_1.message)
              callback(new YAPSError(grpc.status.DATA_LOSS, err_1.message))
            } else {
              logger.log('error', err_1.message)
              callback(new YAPSError(grpc.status.UNKNOWN, err_1.message))
            }
            return [3 /*break*/, 7]
          case 7:
            return [2 /*return*/]
        }
      })
    })
  })
}
var getObjectURL = function (call, callback) {
  logger.log(
    'debug',
    '@yaps/core getObjectURL [request: ' + call.request.getName() + ']'
  )
  // Validating the request
  var errors = storageValidator.getObjectURLRequest.validate({
    name: call.request.getName(),
    bucket: call.request.getBucket()
  })
  if (errors.length > 0) {
    logger.log('warn', '@yaps/core getObjectURL [invalid argument]')
    callback(new YAPSInvalidArgument(errors[0].message))
    return
  }
  fsInstance().statObject(
    call.request.getBucket(),
    call.request.getName(),
    function (err, dataStream) {
      var name = call.request.getName()
      var bucket = call.request.getBucket()
      if (err) {
        callback(
          new YAPSError(
            grpc.status.NOT_FOUND,
            err.message + ": filename '" + name + "' in bucket '" + bucket + "'"
          )
        )
        return
      }
      var url =
        'http://' +
        process.env.FS_HOST +
        ':' +
        process.env.FS_PORT +
        '/' +
        bucket +
        '/' +
        name
      var response = new StoragePB.GetObjectURLResponse()
      response.setUrl(url)
      callback(null, response)
    }
  )
}
module.exports.uploadObject = uploadObject
module.exports.getObjectURL = getObjectURL
//# sourceMappingURL=storage_srv.js.map

var fsInstance = function () {
  var Minio = require('minio')
  return new Minio.Client({
    endPoint: process.env.FS_HOST,
    port: parseInt(process.env.FS_PORT),
    useSSL: false,
    accessKey: process.env.FS_USERNAME,
    secretKey: process.env.FS_SECRET
  })
}
var uploadToFS = function (bucket, pathToObject, object, metadata) {
  if (metadata === void 0) {
    metadata = {}
  }
  return new Promise(function (resolve, reject) {
    var walk = require('walk')
    var path = require('path')
    var logger = require('../common/logger')
    logger.log('verbose', '@yaps/core uploadToFS [bucket: ' + bucket + ']')
    logger.log('verbose', '@yaps/core uploadToFS [path: ' + pathToObject + ']')
    logger.log('verbose', '@yaps/core uploadToFS [object: ' + object + ']')
    var splitPath = function (p) {
      return path.dirname(p).split(path.sep)
    }
    var dirCount = splitPath(pathToObject).length
    var baseDir = splitPath(pathToObject)
      .slice(0, dirCount)
      .join('/')
    var walker = walk.walk(pathToObject)
    logger.log('debug', '@yaps/core uploadToFS [dirCount: ' + dirCount + ']')
    logger.log('debug', '@yaps/core uploadToFS [baseDir: ' + baseDir + ']')
    walker.on('file', function (root, stats, next) {
      var filePath = root + '/' + stats.name
      var destFilePath = root + '/' + (object || stats.name)
      var dest = destFilePath.substring(baseDir.length + 1)
      logger.log('debug', '@yaps/core uploadToFS [root: ' + root + ']')
      logger.log('debug', '@yaps/core uploadToFS [filePath: ' + filePath + ']')
      logger.log(
        'debug',
        '@yaps/core uploadToFS [destFilePath:' + destFilePath + ']'
      )
      logger.log('debug', '@yaps/core uploadToFS [dest: ' + dest + ']')
      fsInstance().fPutObject(bucket, dest, filePath, metadata, function (err) {
        if (err) {
          logger.log('error', err)
          reject(err)
        } else {
          next()
        }
      })
    })
    walker.on('errors', function (root, nodeStatsArray, next) {
      reject(root)
    })
    walker.on('end', function () {
      resolve()
    })
  })
}
var removeDirSync = function (path) {
  var fs = require('fs')
  var logger = require('../common/logger')
  if (fs.existsSync(path)) {
    var files = fs.readdirSync(path)
    if (files.length > 0) {
      files.forEach(function (filename) {
        if (fs.statSync(path + '/' + filename).isDirectory()) {
          removeDirSync(path + '/' + filename)
        } else {
          fs.unlinkSync(path + '/' + filename)
        }
      })
      fs.rmdirSync(path)
    } else {
      fs.rmdirSync(path)
    }
  } else {
    logger.log('warn', 'Directory path not found.')
  }
}
var extract = function (source, target) {
  var tar = require('tar')
  return tar.extract({ file: source, cwd: target })
}
// Replaced tar with inly to support more formats
/*const extract = (source, target) => new Promise((resolve, reject) => {
    const extract = inly(source, target)

    extract.on('error', err => {
        reject(err)
    })

    extract.on('end', () => {
        resolve()
    })
})*/
var getFilesizeInBytes = function (filename) {
  var fs = require('fs')
  return fs.statSync(filename)['size']
}
var mapToObj = function (map) {
  if (!map || map.toArray().length === 0) return {}
  return map.toArray().reduce(function (e) {
    var r = {}
    r[e[0]] = e[1]
    return r
  })
}
module.exports.extract = extract
module.exports.removeDirSync = removeDirSync
module.exports.fsInstance = fsInstance
module.exports.uploadToFS = uploadToFS
module.exports.getFilesizeInBytes = getFilesizeInBytes
module.exports.mapToObj = mapToObj
//# sourceMappingURL=utils.js.map

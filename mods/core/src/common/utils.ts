const fsInstance = () => {
  const Minio = require('minio')

  return new Minio.Client({
    endPoint: process.env.FS_HOST,
    port: parseInt(process.env.FS_PORT),
    useSSL: false,
    accessKey: process.env.FS_USERNAME,
    secretKey: process.env.FS_SECRET
  })
}

const uploadToFS = (bucket, pathToObject, object, metadata = {}) =>
  new Promise((resolve, reject) => {
    const walk = require('walk')
    const path = require('path')
    const logger = require('../common/logger')

    logger.log('verbose', `@yaps/core uploadToFS [bucket: ${bucket}]`)
    logger.log('verbose', `@yaps/core uploadToFS [path: ${pathToObject}]`)
    logger.log('verbose', `@yaps/core uploadToFS [object: ${object}]`)

    const splitPath = p => path.dirname(p).split(path.sep)
    const dirCount = splitPath(pathToObject).length
    const baseDir = splitPath(pathToObject)
      .slice(0, dirCount)
      .join('/')
    const walker = walk.walk(pathToObject)

    logger.log('debug', `@yaps/core uploadToFS [dirCount: ${dirCount}]`)
    logger.log('debug', `@yaps/core uploadToFS [baseDir: ${baseDir}]`)

    walker.on('file', (root, stats, next) => {
      const filePath = root + '/' + stats.name
      const destFilePath = root + '/' + (object || stats.name)
      const dest = destFilePath.substring(baseDir.length + 1)

      logger.log('debug', `@yaps/core uploadToFS [root: ${root}]`)
      logger.log('debug', `@yaps/core uploadToFS [filePath: ${filePath}]`)
      logger.log(
        'debug',
        `@yaps/core uploadToFS [destFilePath:${destFilePath}]`
      )
      logger.log('debug', `@yaps/core uploadToFS [dest: ${dest}]`)

      fsInstance().fPutObject(bucket, dest, filePath, metadata, err => {
        if (err) {
          logger.log('error', err)
          reject(err)
        } else {
          next()
        }
      })
    })

    walker.on('errors', (root, nodeStatsArray, next) => {
      reject(root)
    })

    walker.on('end', () => {
      resolve()
    })
  })

const removeDirSync = path => {
  const fs = require('fs')
  const logger = require('../common/logger')
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

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

const extract = (source, target) =>  {
  const tar = require('tar')
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

const getFilesizeInBytes = filename => {
  const fs = require('fs')
  return fs.statSync(filename)['size']
}

const mapToObj = map => {
  if (!map || map.toArray().length === 0) return {}
  return map.toArray().reduce(e => {
    const r = {}
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

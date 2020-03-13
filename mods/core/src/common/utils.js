/**
 * @author Pedro Sanders
 * @since v1
 */
const Minio = require('minio')
const inly = require('inly')
const path = require('path')
const fs = require('fs')
const walk = require('walk')
const logger = require('../common/logger')

const fsInstance = () => new Minio.Client({
    endPoint: process.env.FS_HOST,
    port: parseInt(process.env.FS_PORT),
    useSSL: false,
    accessKey: process.env.FS_USERNAME,
    secretKey: process.env.FS_SECRET
})

const uploadToFS = (bucket, pathToObject, object) => new Promise((resolve, reject) => {
    logger.log('verbose', `@yaps/core uploadToFS [bucket -> ${bucket}]`)
    logger.log('verbose', `@yaps/core uploadToFS [path -> ${pathToObject}]`)
    logger.log('verbose', `@yaps/core uploadToFS [object -> ${object}]`)

    const splitPath = p => path.dirname(p).split(path.sep)
    const dirCount = splitPath(pathToObject).length
    const baseDir = splitPath(pathToObject).slice(0, dirCount).join('/')
    const walker = walk.walk(pathToObject)

    logger.log('debug', `@yaps/core uploadToFS [dirCount -> ${dirCount}]`)
    logger.log('debug', `@yaps/core uploadToFS [baseDir -> ${baseDir}]`)

    walker.on('file', (root, stats, next) => {
        const filePath = root + '/' + stats.name
        const destFilePath = root + '/' + (object || stats.name)
        const dest = destFilePath.substring(baseDir.length + 1)

        logger.log('debug', `@yaps/core uploadToFS [root -> ${root}]`)
        logger.log('debug', `@yaps/core uploadToFS [filePath -> ${filePath}]`)
        logger.log('debug', `@yaps/core uploadToFS [destFilePath -> ${destFilePath}]`)
        logger.log('debug', `@yaps/core uploadToFS [dest -> ${dest}]`)

        fsInstance().fPutObject(bucket, dest , filePath, err => {
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
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function(filename) {
        if (fs.statSync(path + "/" + filename).isDirectory()) {
          removeDir(path + "/" + filename)
        } else {
          fs.unlinkSync(path + "/" + filename)
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

const extract = (source, target) => new Promise((resolve, reject) => {
    const extract = inly(source, target)

    extract.on('error', err => {
        reject(err)
    })

    extract.on('end', () => {
        resolve()
    })
})

const getFilesizeInBytes = filename => fs.statSync(filename)['size']

module.exports.extract = extract
module.exports.removeDirSync = removeDirSync
module.exports.fsInstance = fsInstance
module.exports.uploadToFS = uploadToFS
module.exports.getFilesizeInBytes = getFilesizeInBytes

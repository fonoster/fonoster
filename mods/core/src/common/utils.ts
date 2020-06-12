import fs from 'fs'
import walk from 'walk'
import path from 'path'
import logger from '@fonos/logger'

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

const uploadToFS = (
  bucket: string,
  pathToObject: string,
  object?: string,
  metadata: object = {}
) =>
  new Promise((resolve, reject) => {
    logger.log('verbose', `@fonos/core uploadToFS [bucket: ${bucket}]`)
    logger.log('verbose', `@fonos/core uploadToFS [path: ${pathToObject}]`)
    logger.log('verbose', `@fonos/core uploadToFS [object: ${object}]`)

    const splitPath = (p: string) => path.dirname(p).split(path.sep)
    const dirCount = splitPath(pathToObject).length
    const baseDir = splitPath(pathToObject)
      .slice(0, dirCount)
      .join('/')
    const walker = walk.walk(pathToObject)

    logger.log('debug', `@fonos/core uploadToFS [dirCount: ${dirCount}]`)
    logger.log('debug', `@fonos/core uploadToFS [baseDir: ${baseDir}]`)

    walker.on(
      'file',
      (root: string, stats: { name: string }, next: () => void) => {
        const filePath = root + '/' + stats.name
        const destFilePath = root + '/' + (object || stats.name)
        const dest = destFilePath.substring(baseDir.length + 1)

        logger.log('debug', `@fonos/core uploadToFS [root: ${root}]`)
        logger.log('debug', `@fonos/core uploadToFS [filePath: ${filePath}]`)
        logger.log(
          'debug',
          `@fonos/core uploadToFS [destFilePath:${destFilePath}]`
        )
        logger.log('debug', `@fonos/core uploadToFS [dest: ${dest}]`)
        logger.log('debug', `@fonos/core uploadToFS [metadata: ${metadata}]`)

        fsInstance().fPutObject(
          bucket,
          dest,
          filePath,
          metadata,
          (err: any) => {
            if (err) {
              logger.log('error', err)
              reject(err)
            } else {
              next()
            }
          }
        )
      }
    )

    walker.on('errors', (root: any, nodeStatsArray: any, next: any) => {
      reject(root)
    })

    walker.on('end', () => {
      resolve()
    })
  })

const removeDirSync = (path: string) => {
  if (fs.existsSync(path)) {
    const files = fs.readdirSync(path)

    if (files.length > 0) {
      files.forEach(function (filename: string) {
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

const extract = (source: string, target: string) => {
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

const getFilesizeInBytes = (filename: string) => fs.statSync(filename)['size']

const mapToObj = (map: {
  toArray: () => {
    (): any
    new (): any
    length: number
    reduce: { (arg0: (e: any[]) => {}): any; new (): any }
  }
}) => {
  if (!map || map.toArray().length === 0) return {}
  return map.toArray().reduce((e: any[]) => {
    const r: any = {}
    r[e[0]] = e[1]
    return r
  })
}

export {
  extract,
  removeDirSync,
  fsInstance,
  uploadToFS,
  getFilesizeInBytes,
  mapToObj
}

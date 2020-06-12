import logger from '@fonos/logger'
import { FonosService, StorageService, StoragePB } from '@fonos/core'

class Storage extends FonosService {
  constructor (options: any) {
    super(StorageService.StorageClient, options)
    super.init()
  }

  async getObjectURL (request: { name: string; bucket: string }) {
    return new Promise((resolve, reject) => {
      logger.log(
        'verbose',
        `@fonos/storage getObjectURL [name: ${request.name} bucket: ${request.bucket}]`
      )

      const gour = new StoragePB.GetObjectURLRequest()
      gour.setName(request.name)
      gour.setBucket(request.bucket)

      super
        .getService()
        .getObjectURL(gour, super.getMeta(), (err: any, res: any) => {
          if (err) {
            logger.log('error', err)
            reject(err)
          } else {
            logger.log('debug', `@fonos/storage getObjectURL [url: ${res}]`)
            resolve(res.getUrl())
          }
        })
    }).catch(e => {
      throw e
    })
  }
}

export default Storage

import Verb from './verb'
import Play from './play'
import path from 'path'
import logger from '@fonos/logger'
import { transcodeSync, computeFilename } from '@fonos/tts'

class Say extends Verb {
  _config: any
  channel: any

  constructor (config: any, channel: any) {
    super(config)
    this._config = config
    this.channel = channel
  }

  run (text: string, options: any) {
    if (!text) throw new Error('You must provide a text.')
    if (!this._config.tts) throw new Error('Not tts engine found')
    if (!this._config.storage) throw new Error('Not storage object found')
    if (!this._config.bucket) throw new Error('Not bucket found')

    // The final format pushed to the bucket will always be .wav
    const metadata = { 'Content-Type': 'audio/x-wav' }
    const filename = 't_' + computeFilename(text, options)

    let url

    try {
      url = this._config.storage.getObjectURLSync({
        name: filename,
        bucket: this._config.bucket
      })
    } catch (e) {
      logger.log(
        'silly',
        `@fonos/vouice.YapsWrapperChannel.say [no url found for file ${filename}]`
      )
    }

    if (url === undefined) {
      const pathToFile = this._config.tts.synthesizeSync(text, options)
      const pathToTranscodedFile = path.join(path.dirname(pathToFile), filename)
      transcodeSync(pathToFile, pathToTranscodedFile)

      this._config.storage.uploadObjectSync({
        filename: pathToTranscodedFile,
        bucket: this._config.bucket,
        metadata
      })

      url = this._config.storage.getObjectURLSync({
        name: filename,
        bucket: this._config.bucket
      })
    }

    return new Play(this._config, this.channel).run(url, options)
  }
}

export default Say

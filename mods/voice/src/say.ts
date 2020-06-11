import Verb from './verb'
import Play from './play'
import path from 'path'
import logger from '@fonos/logger'
import { transcodeSync, computeFilename } from '@fonos/tts'

class Say extends Verb {
  constructor (channel: any, config: any) {
    super(channel, config)
  }

  run (text: string, options: any): string {
    if (!text) throw new Error('You must provide a text.')
    if (!this.config.tts) throw new Error('Not tts engine found')
    if (!this.config.storage) throw new Error('Not storage object found')
    if (!this.config.bucket) throw new Error('Not bucket found')

    // The final format pushed to the bucket will always be .wav
    const metadata = { 'Content-Type': 'audio/x-wav' }
    const filename = 't_' + computeFilename(text, options)

    let url

    try {
      url = this.config.storage.getObjectURLSync({
        name: filename,
        bucket: this.config.bucket
      })
    } catch (e) {
      logger.log(
        'silly',
        `@fonos/vouice.YapsWrapperChannel.say [no url found for file ${filename}]`
      )
    }

    if (url === undefined) {
      const pathToFile = this.config.tts.synthesizeSync(text, options)
      const pathToTranscodedFile = path.join(path.dirname(pathToFile), filename)
      transcodeSync(pathToFile, pathToTranscodedFile)

      this.config.storage.uploadObjectSync({
        filename: pathToTranscodedFile,
        bucket: this.config.bucket,
        metadata
      })

      url = this.config.storage.getObjectURLSync({
        name: filename,
        bucket: this.config.bucket
      })
    }

    return new Play(this.config, this.channel).run(url, options)
  }
}

export default Say

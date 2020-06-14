import Verb from './verb'
import Play, { PlayOptions } from './play'
import path from 'path'
import logger from '@fonos/logger'
import { transcodeSync, computeFilename } from '@fonos/tts'

class Say extends Verb {
  constructor (channel: any, config: any) {
    super(channel, config)
    if (!config.tts) throw 'Not tts engine found'
    if (!config.storage) throw 'Not storage object found'
    if (!config.bucket) throw 'Not bucket found'
  }

  private synth (text: string, filename: string, options?: any): string {
    const pathToFile = this.config.tts.synthesizeSync(text, options)

    const pathToTranscodedFile = path.join(path.dirname(pathToFile), filename)
    transcodeSync(pathToFile, pathToTranscodedFile)

    const metadata = { 'Content-Type': 'audio/x-wav' }
    this.config.storage.uploadObjectSync({
      filename: pathToTranscodedFile,
      bucket: this.config.bucket,
      metadata
    })

    return this.config.storage.getObjectURLSync({
      name: filename,
      bucket: this.config.bucket
    })
  }

  run (text: string, options: PlayOptions): string {
    if (!text) throw new Error('You must provide a text.')
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
        `@fonos/voice.YapsWrapperChannel.say [no url found for file ${filename}]`
      )
    }

    if (!url) url = this.synth(text, filename, options)

    return new Play(this.channel, this.config).run(url, options)
  }
}

export default Say

import Verb, { VerbConfig } from './verb'
import Play, { PlayOptions } from './play'
import path from 'path'
import logger from '@fonos/logger'
import { transcodeSync, computeFilename } from '@fonos/tts'

class Say extends Verb {
  constructor (channel: any, config: VerbConfig) {
    super(channel, config)
  }

  private synth (text: string, filename: string, options?: any): string {
    try {
      const pathToFile = this.config.tts.synthesizeSync(text, options)

      const pathToTranscodedFile = path.join(path.dirname(pathToFile), filename)
      transcodeSync(pathToFile, pathToTranscodedFile)

      const metadata = { 'Content-Type': 'audio/x-wav' }
      this.config.storage.uploadObjectSync({
        filename: pathToTranscodedFile,
        bucket: this.config.bucket,
        metadata
      })

      if (process.env.NODE_ENV === 'dev') {
        logger.log(
          'debug',
          '@fonos/voice.Say [generating file url using enviroment variables from client side]'
        )
        return `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${this.config.bucket}/${this.config.accessKeyId}/${filename}`
      }

      return this.config.storage.getObjectURLSync({
        filename: filename,
        bucket: this.config.bucket,
        accessKeyId: this.config.accessKeyId
      })
    } catch (e) {
      logger.log('error', '@fonos/voice.Say [error synthesizing audio]')
      throw new Error(`@fonos/voice.Say [${e}]`)
    }
  }

  run (text: string, options: PlayOptions): string {
    if (!text) throw new Error('You must provide a text.')
    const filename = 't_' + computeFilename(text, options)

    let url
    try {
      url = this.config.storage.getObjectURLSync({
        filename,
        bucket: this.config.bucket,
        accessKeyId: this.config.accessKeyId
      })

      if (process.env.NODE_ENV === 'dev') {
        logger.log(
          'debug',
          '@fonos/voice.Say [generating file url using enviroment variables from client side]'
        )
        url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${this.config.bucket}/${this.config.accessKeyId}/${filename}`
      }
    } catch (e) {
      logger.log(
        'error',
        `@fonos/voice.Say [no url found for file ${filename} in bucket ${this.config.bucket}]`
      )
      logger.error(e)
    }

    if (!url) url = this.synth(text, filename, options)
    try {
      return new Play(this.channel, this.config).run(url, options)
    } catch (e) {
      throw new Error(`@fonos/voice.Say [${e}] (failed to play)`)
    }
  }
}

export default Say

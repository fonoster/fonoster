import Verb from './verb'
import Play, { PlayOptions } from './play'
import path from 'path'
import logger from '@fonos/logger'
import { transcodeSync, computeFilename } from '@fonos/tts'

class Say extends Verb {
  constructor (channel: any, config: any) {
    super(channel, config)
    if (!config.tts) throw 'No tts engine found'
    if (!config.storage) throw 'No storage object found'
    if (!config.bucket) throw 'No bucket found'
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

      return this.config.storage.getObjectURLSync({
        name: filename,
        bucket: this.config.bucket
      })
    } catch (e) {
      logger.log('error', `@fonos/voice.Say [Error synthesizing audio]`)
      throw new Error(e)
    }
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

      // We add this because in development the files server
      // could be at a remote network
      if (process.env.NODE_ENV === 'dev') {
        logger.log(
          'debug',
          `@fonos/voice.Say [generating file url using enviroment variables from client side]`
        )
        url = `http://${process.env.FS_HOST}:${process.env.FS_PORT}/${this.config.bucket}/${filename}`
      }
    } catch (e) {
      logger.log(
        'warn',
        `@fonos/voice.Say [no url found for file ${filename} in bucket ${this.config.bucket}]`
      )
    }

    if (!url) url = this.synth(text, filename, options)
    try {
      return new Play(this.channel, this.config).run(url, options)
    } catch (e) {
      throw new Error(`@fonos/voice.Say [${e}] (Trying to play)`)
    }
  }
}

export default Say


interface VerbConfig {
  tts: any
  storage: any
  bucket: 'public'
  accessKeyId: string
}

class Verb {
  channel: any
  config: VerbConfig
  constructor (channel: any, config?: VerbConfig) {
    this.channel = channel
    this.config = config
  }
}
export { Verb as default, VerbConfig }

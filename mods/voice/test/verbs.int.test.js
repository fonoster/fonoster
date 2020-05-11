const MockChannel = require('./mock_channel')
const Verbs = require('../src/verbs')
const { MaryTTS } = require('@fonos/tts')
const { Storage } = require('@fonos/storage')
const { updateBucketPolicy } = require('@fonos/core')
const expect = require('chai').expect

describe('@fonos/tts', () => {
  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy('default')

    storage = new Storage({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  context('say verb', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    channel.setData(['1'])

    it('throws because storage is not setup', () => {
      expect(() => verbs.say('Hello World')).to.throw
    })

    it('does not throws because storage was setup', () => {
      verbs.config({
        bucket: 'defualt',
        tts: new MaryTTS(),
        storage: new Storage()
      })
      expect(() => verbs.say('Hello World')).to.not.throw
    })
  })
})

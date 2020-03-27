const MockChannel = require('./mock_channel')
const Verbs = require('../src/verbs')
const { MaryTTS } = require('@yaps/tts')
const { Storage } = require('@yaps/storage')
const { updateBucketPolicy } = require('@yaps/core')
const assert = require('assert')

describe('Verbs tests', () => {
  before(async () => {
    // This will create the bucket if it does not exist
    await updateBucketPolicy('default')

    storage = new Storage({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
  })

  // This can only be call inside a Fiber
  // Consider using Fiber to wrap the method
  it.skip('Test verb say', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    channel.setData(['1'])

    try {
      verbs.say('Hello World')
      done('not good')
    } catch (e) {}

    verbs.config({
      bucket: 'defualt',
      tts: new MaryTTS(),
      storage: new Storage()
    })

    verbs.say('Hello Raysa')
    done()
  })
})

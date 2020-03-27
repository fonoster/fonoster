const MockChannel = require('./mock_channel')
const Verbs = require('../src/verbs')
const { MaryTTS } = require('@yaps/tts')
const assert = require('assert')

describe('Verbs tests', () => {
  it('Test verb answer', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    assert.equal(0, verbs.answer())
    done()
  })

  it('Test verb hangup', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    assert.equal(1, verbs.hangup())
    done()
  })

  it('Test verb play', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    channel.setData(['1'])
    const result = verbs.play('beep')
    assert.equal('1', result)

    try {
      verbs.play('beep', { finishOnKey: '%' })
      done('not good')
    } catch (e) {}

    done()
  })

  it('Test verb gather', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    try {
      verbs.gather('', { finishOnKey: 'aa', maxDigits: 'p' })
      done('not good')
    } catch (e) {}

    try {
      verbs.gather('', { timeout: 0 })
      done('not good')
    } catch (e) {}

    // Stops reading at maxDigits
    channel.setData(['1', '2', '3', '4'])
    let result = verbs.gather('', { maxDigits: 4 })
    assert.equal('1234', result)

    // Stops reading at finishOnKey
    channel.setData(['1', '2', '3', '4', '*'])
    channel.resetDataPointer()
    result = verbs.gather('', { maxDigits: 6, finishOnKey: '*' })
    assert.equal('1234', result)

    // Stops reading at null because a timeout event
    channel.setData(['1', '2', '3', null])
    channel.resetDataPointer()
    result = verbs.gather('', { timeout: 5, maxDigits: 4 })
    assert.equal('123', result)

    done()
  })

  it('Test verb wait', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    try {
      verbs.wait(-1)
      done('not good')
    } catch (e) {}

    done()
  })

  it('Test verb record', done => {
    const channel = new MockChannel()

    const verbs = new Verbs(channel)

    try {
      verbs.record({ beep: 'a' })
      done('not good')
    } catch (e) {}

    verbs.record()

    done()
  })

  it('Test verb stash', done => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)
    verbs.stash('key1', 'val1')
    verbs.stash('key2', 'val2')
    verbs.stash('key1', 'val3')
    assert.equal(2, verbs.getCallDetailRecord().vars.size)
    done()
  })
})

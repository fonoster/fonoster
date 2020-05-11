const MockChannel = require('./mock_channel')
const Verbs = require('../src/verbs')
const expect = require('chai').expect

describe('@fonos/voice/verbs', () => {
  context('answer/hangup verbs', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    it('will return zero', () => {
      expect(verbs.answer()).to.be.equal(0)
    })

    it('it will hangup and return one', () => {
      expect(verbs.hangup()).to.be.equal(1)
    })
  })

  context('play verb', () => {
    const channel = new MockChannel()
    channel.setData(['1'])
    const verbs = new Verbs(channel)

    it('plays the file', () => {
      const result = verbs.play('beep')
      expect(result).to.be.equal('1')
    })

    it('will fail due to an invalid character on finishOnKey', () => {
      expect(() => verbs.play('beep', { finishOnKey: '%' })).to.throw(
        'Invalid finishOnKey parameter: found % but must be a single digit type of 0-9,#,*'
      )
    })
  })

  context('gather verb', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    it('will fail due to an invalid character on finishOnKey and bad timeout', () => {
      expect(() => verbs.gather('', { finishOnKey: 'aa', maxDigits: 'p' })).to
        .throw
      expect(() => verbs.gather('', { timeout: 0 })).to.throw
    })

    it('will gather some digits', done => {
      // Stops reading at maxDigits
      channel.setData(['1', '2', '3', '4'])
      let result = verbs.gather('', { maxDigits: 4 })
      expect(result).to.be.equal('1234')

      // Stops reading at finishOnKey char
      channel.setData(['1', '2', '3', '4', '*'])
      channel.resetDataPointer()
      result = verbs.gather('', { maxDigits: 6, finishOnKey: '*' })
      expect(result).to.be.equal('1234')

      // Stops reading at null because a timeout event
      channel.setData(['1', '2', '3', null])
      channel.resetDataPointer()
      result = verbs.gather('', { timeout: 5, maxDigits: 4 })
      expect(result).to.be.equal('123')

      done()
    })
  })

  context('wait verb', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    it('wait for chacter', () => {
      expect(() => verbs.wait(-1))
    })
  })

  context('stash verb', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    it('throws because of invalid chacter', () => {
      expect(() => verbs.record({ beep: 'a' })).to.throw(
        'a is not an acceptable value. Must be a true or false'
      )
    })

    it('does not throw', () => {
      expect(() => verbs.record()).to.not.throw
    })
  })

  context('record verb', () => {
    const channel = new MockChannel()
    const verbs = new Verbs(channel)

    it('throws because of invalid chacter', () => {
      const channel = new MockChannel()
      const verbs = new Verbs(channel)
      verbs.stash('key1', 'val1')
      verbs.stash('key2', 'val2')
      verbs.stash('key3', 'val3')

      expect(verbs.getCallDetailRecord().vars)
        .to.be.a('map')
        .to.have.all.keys(['key1', 'key2', 'key3'])
    })
  })
})

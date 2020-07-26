import MaryTTS from '../src/mary_tts'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import path from 'path'
import http from 'http'
import fs from 'fs'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') })
}

describe('@fonos/marytts', () => {
  afterEach(() => sandbox.restore())

  it('rejects if the TTS engine response is not 200', () => {
    const join = sandbox.spy(path, 'join')
    const createWriteStream = sandbox.spy(fs, 'createWriteStream')
    const get = sandbox.stub(http, 'get')
    const pipe = sandbox.stub()
    const response = {
      statusCode: 201,
      pipe
    }
    get.yields(response)

    const tts = new MaryTTS()

    expect(tts.synthesize('hello world')).to.eventually.rejectedWith(
      'Request failed status code'
    )

    expect(pipe).to.not.have.been.called
    expect(createWriteStream).to.not.have.been.called
    expect(join).to.have.been.calledOnce
    expect(get).to.have.been.calledOnce
  })

  it('synthesizes text and returns path to file', () => {
    const join = sandbox.spy(path, 'join')
    const createWriteStream = sandbox.spy(fs, 'createWriteStream')
    const get = sandbox.stub(http, 'get')
    const pipe = sandbox.stub()
    const response = {
      statusCode: 200,
      pipe
    }
    get.yields(response)

    const tts = new MaryTTS()

    expect(tts.synthesize('hello world')).to.eventually.contain('/tmp/')
    expect(pipe).to.have.been.calledOnce
    expect(join).to.have.been.calledOnce
    expect(createWriteStream).to.have.been.calledOnce
    expect(get).to.have.been.calledOnce
  })
})

import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import Storage from '../src/storage'
const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

describe('Storage Service', () => {
  let storage: Storage

  before(async () => {
    storage = new Storage({
      endpoint: `${process.env.APISERVER_ADDR}`
    })
  })

  it.only('Get object url', done => {
    storage
      .getObjectURL({ name: 'test.txt', bucket: 'default' })
      .then(result => {
        expect(result).to.include('/default/test.txt')
      })
      .catch(e => done(e))
  })
})

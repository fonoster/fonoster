import Numbers from '../src/numbers'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

describe('Numbers Service', () => {
  let numbers: any
  let numberRef: any

  before(() => {
    numbers = new Numbers({
      endpoint: `${process.env.APISERVER_ENDPOINT}`
    })
    // TODO Create provider and app if doesn't exist
  })

  it.skip('fails because provider does not exist', () => {
    expect(
      numbers.createNumber({
        e164Number: '0000000000',
        ingressApp: 'default'
      })
    ).to.be.rejected
    //).to.be.rejectedWith('FAILED_PRECONDITION')
  })

  it.skip('fails because provider ref does not exist', () => {
    expect(
      numbers.createNumber({
        providerRef: 'bad_reference',
        e164Number: '0000000000',
        ingressApp: 'default'
      })
    ).to.be.rejected
    //).to.be.rejectedWith('FAILED_PRECONDITION')
  })

  it('creates a number for the given provider', async () => {
    const number = await numbers.createNumber({
      providerRef: 'gw50a1a4ca',
      e164Number: '0000000000',
      ingressApp: 'default'
    })
    numberRef = number.getRef()
    expect(number.getE164Number()).to.be.equal('0000000000')
  })

  it('returns ingress app', async () => {
    const app = await numbers.getIngressApp({ e164Number: '0000000000' })
    expect(app.getName()).to.be.equal('default')
  })

  it('rejects request because number already exist', () => {
    expect(
      numbers.createNumber({
        providerRef: '5e7f86e3a0484e0615c36f09',
        e164Number: '+17853178070',
        ingressApp: 'default'
      })
    ).to.be.rejected('FAILED_PRECONDITION')
  })

  it('list all the numbers', () => {
    const result = numbers.listNumbers({
      pageSize: 10,
      pageToken: '0',
      view: 0
    })
    expect(result.getNumbersList()).to.be.greaterThan(0)
  })

  it('gets a number by its reference', async () => {
    const number = await numbers.getNumber(numberRef)
    expect(number.getRef()).to.be.equal(numberRef)
  })

  it('updates number', async () => {
    const number = {
      ref: numberRef,
      aorLink: 'sip:1001@sip.local'
    }

    const numberFromDB = await numbers.updateNumber(number)
    expect(number.ref).to.be.equal(numberFromDB.getRef())
  })

  // WARNING: This needs to run with a clean database or you will see
  // a 405 error coming from rouer because the numberRef is empty...
  it('deletes number', () => {
    expect(numbers.deleteNumber(numberRef)).to.be.fulfilled
  })

  it('rejects request because number does not exist', () => {
    expect(numbers.deleteNumber('1234')).to.be.rejectedWith('NOT_FOUND')
  })
})

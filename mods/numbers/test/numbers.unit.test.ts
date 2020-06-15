import Numbers from '../src/numbers'
import chai from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'
import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '.env') })
}

describe('Numbers Service', () => {
  let numbers
  let numberRef

  before(() => {
    numbers = new Numbers({
      endpoint: `${process.env.APISERVER_ADDR}`
    })
  })

  it.only('fails because provider does not exist', () => {
    expect(
      numbers.createNumber({
        e164Number: '0000000000',
        ingressApp: 'hello-monkeys'
      })
    ).to.be.rejectedWith('FAILED_PRECONDITION')
  })

  it('fails because provider ref is invalid', () => {
    expect(
      numbers.createNumber({
        providerRef: 'bad_reference',
        e164Number: '0000000000',
        ingressApp: 'hello-monkeys'
      })
    ).to.be.rejectedWith('FAILED_PRECONDITION')
  })

  it('creates a number for the given provider', async () => {
    const number = numbers.createNumber({
      providerRef: '5e7fc0caa0484e0d669cb783',
      e164Number: '0000000000',
      ingressApp: 'hello-monkeys'
    })
    expect(number.getRef()).to.be.equal('5e7fc0caa0484e0d669cb783')
    expect(number.getE164Number()).to.be.equal('0000000000')
  })

  it('returns ingress app', async () => {
    const app = await numbers.getIngressApp({ e164Number: '0000000000' })
    expect(app.getName()).to.be.equal('hello-monkeys')
  })

  it('rejects request because number already exist', () => {
    expect(
      numbers.createNumber({
        providerRef: '5e7f86e3a0484e0615c36f09',
        e164Number: '+17853178070',
        ingressApp: 'hello-monkeys'
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

  it('deletes number', () => {
    numbers.deleteNumber(numberRef)
  })

  it('rejects request because number does not exist', () => {
    expect(numbers.deleteNumber('1234')).to.be.rejectedWith('NOT_FOUND')
  })
})

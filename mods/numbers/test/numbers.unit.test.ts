import Numbers from '../src/numbers'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon, { assert, fake } from 'sinon'

import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import {
  FonosService,
  NumbersPB,
  AppManagerPB
} from '@fonos/core'

import { CreateNumberResponse } from '../src/types'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

describe('@fonos/number', () => {
  let numbers: any

  before(() => {
    numbers = new Numbers()
    // TODO Create provider and app if doesn't exist
  })

  afterEach(() => {
    sandbox.restore();
    sinon.restore();
  })

  it('should create a number', async () => {
    const numberReturn: CreateNumberResponse = {
      aorLink: 'test',
      e164Number: 'test',
      ingressApp: 'test',
      providerRef: 'test',
      ref: 'test'
    }
    const numberReturnPromise = new NumbersPB.Number()
    numberReturnPromise.setAorLink(numberReturn.aorLink);
    numberReturnPromise.setIngressApp(numberReturn.ingressApp);


    const stubNumber = sandbox.stub(FonosService.prototype, 'getService').returns({
      createNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(numberReturnPromise)
          )
        }
      }
    });
    const result: CreateNumberResponse = await numbers.createNumber({
      e164Number: '0000000000',
      ingressApp: 'default'
    })

    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(numberReturn.aorLink).to.be.equal(result.aorLink);
    expect(numberReturn.ingressApp).to.be.equal(result.ingressApp);

  })

  it('should get a number by ref', async () => {
    const numberReturn: CreateNumberResponse = {
      aorLink: 'test',
      e164Number: 'test',
      ingressApp: 'test',
      providerRef: 'test',
      ref: 'test'
    }
    const numberReturnPromise = new NumbersPB.Number()
    numberReturnPromise.setAorLink(numberReturn.aorLink);
    numberReturnPromise.setIngressApp(numberReturn.ingressApp);

    const stubNumber = sandbox.stub(FonosService.prototype, 'getService').returns({
      getNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(numberReturnPromise)
          )
        }
      }
    });
    let result = await numbers.getNumber('ref');
    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(numberReturn.aorLink).to.be.equal(result.aorLink);
    expect(numberReturn.ingressApp).to.be.equal(result.ingressApp);
  })

  it('should delete a number', async () => {
    const refReturn = {
      ref: 'ref'
    }
    const stubNumber = sandbox.stub(FonosService.prototype, 'getService').returns({
      deleteNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(refReturn)
          )
        }
      }
    });
    let result = await numbers.deleteNumber('ref');

    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(refReturn.ref).to.be.equal(result.ref);
  })

  it('should get a number list', async () => {
    const stubNumber = sandbox.stub(FonosService.prototype, 'getService').returns({
      listNumbers: () => {
        return {
          sendMessage: (() => Promise.resolve([])
          )
        }
      }
    });
    let result = await numbers.listNumbers({ pageSize: 0, pageToken: 0, view: 0 });
    expect(stubNumber.calledOnce).to.be.equal(true)
  })

  it('Should return error with aorLink and ingressApp', async () => {
    let request = {
      aorLink: 'x',
      ingressApp: 'x'
    };

    const numberReturnPromise = new NumbersPB.Number()


    sandbox.stub(FonosService.prototype, 'getService').returns({
      getNumber: () => {
        return {
          sendMessage: ((r: any) => Promise.resolve(numberReturnPromise)
          )
        }
      }
    });
    sandbox.stub(numbers, 'getNumber').returns({})
    sinon.spy(numbers, 'updateNumber')
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith('are not compatible parameters')
  })
  it('Should return error with no aorLink and ingressApp', async () => {
    let request = {
    };
    const numberReturnPromise = new NumbersPB.Number()
    sandbox.stub(FonosService.prototype, 'getService').returns({
      getNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(numberReturnPromise)
          )
        }
      }
    });
    sandbox.stub(numbers, 'getNumber').returns({})
    sinon.spy(numbers, 'updateNumber')
    expect(numbers.updateNumber(request)).to.eventually.be.rejectedWith('You must provider either')
  })
  it('Should udpdate a number with aorLink', async () => {
    let request = {
      ref: 'x',
      aorLink: "x"
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);
    sandbox.stub(FonosService.prototype, 'getService').returns({
      updateNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(returnNumberDb)
          )
        }
      },
      getNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(returnNumberDb)
          )
        }
      }
    });
    let result = await numbers.updateNumber(request);

    expect(result.ref).to.be.equal(request.ref);

  })
  it('Should udpdate a number with ingressApp', async () => {
    let request = {
      ref: 'x',
      ingressApp: "test"
    };
    const returnNumberDb = new NumbersPB.Number();
    returnNumberDb.setRef(request.ref);

    sandbox.stub(numbers, 'getNumber').returns(returnNumberDb)
    sandbox.stub(FonosService.prototype, 'getService').returns({
      updateNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(returnNumberDb)
          )
        }
      },
      getNumber: () => {
        return {
          sendMessage: (() => Promise.resolve(returnNumberDb)
          )
        }
      }
    });
    let result = await numbers.updateNumber(request);
    expect(request.ref).to.be.equal(result.ref);

  })

  it('Should return an app', async () => {

    const returnApp = new AppManagerPB.App()
    sandbox.stub(FonosService.prototype, 'getService').returns({
      getIngressApp: () => {
        return {
          sendMessage: (() => Promise.resolve(returnApp)
          )
        }
      }
    });
    let result = await numbers.getIngressApp("ref");
    expect(result).to.be.equal(returnApp);

  })

})
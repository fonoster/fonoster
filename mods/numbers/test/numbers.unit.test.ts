import Numbers from '../src/numbers'
import chai from 'chai'
import sinonChai from 'sinon-chai'
import sinon, { assert, fake } from 'sinon'

import chaiAsPromised from 'chai-as-promised'
import { join } from 'path'
import {
  FonosService,
  NumbersPB,
AppManagerPB} from '@fonos/core'

import {CreateNumberResponse} from '../src/types'

const expect = chai.expect
chai.use(sinonChai)
chai.use(chaiAsPromised)
const sandbox = sinon.createSandbox()

if (process.env.NODE_ENV === 'dev') {
  require('dotenv').config({ path: join(__dirname, '..', '..', '..', '.env') })
}

describe('Numbers Service', () => {
  let numbers: any
  let numberRef: any

  before(() => {
    numbers = new Numbers()
    // TODO Create provider and app if doesn't exist
  })

  afterEach(() =>{
    sandbox.restore();
    sinon.restore();
  })

  it('Creating Number',async () => {
    const numberReturn : CreateNumberResponse ={
      aorLink:'test',
      e164Number:'test',
      ingressApp:'test',
      providerRef:'test',
      ref:'test'
    }
    const numberReturnPromise = new NumbersPB.Number()
    numberReturnPromise.setAorLink(numberReturn.aorLink);
    numberReturnPromise.setIngressApp(numberReturn.ingressApp);

   
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
      createNumber:() =>{
        return{
          sendMessage: ((r: any) => Promise.resolve(numberReturnPromise)
          )}
      }
    });
    const result :CreateNumberResponse = await numbers.createNumber({
        e164Number: '0000000000',
        ingressApp: 'default'
      })
        
    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(numberReturn.aorLink).to.be.equal(result.aorLink);
    expect(numberReturn.ingressApp).to.be.equal(result.ingressApp);

  })

  it('Get a number by ref', async () =>{
    const numberReturn = new NumbersPB.Number()
    let action = new Numbers(); 
    numberReturn.setE164Number('test');
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        getNumber:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(numberReturn)
            )}
        }
      });
     let result = await action.getNumber('ref');
      
    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(numberReturn).to.be.equal(result);
  })

  it('Deleting a number', async () =>{
    const refReturn = {} 
    sandbox.spy();
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        deleteNumber:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(refReturn)
            )}
        }
      });
     let result = await numbers.deleteNumber('ref');
      
    expect(stubNumber.calledOnce).to.be.equal(true)
    expect(refReturn).to.be.equal(result);
  })

  it('Listing a number', async () =>{
     const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        listNumbers:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve([])
            )}
        }
      });
     let result = await numbers.listNumbers({pageSize:0,pageToken:0,view:0});      
    expect(stubNumber.calledOnce).to.be.equal(true)
  })

  it('Should return error with aorLink and ingressApp', async () =>{
    let request ={
        aorLink:"test",
        ingressApp:"test"
    };
    const stubDb = sandbox.stub(numbers,'getNumber').returns({})
    const numberSpy = sinon.spy(numbers,'updateNumber')
    try{
        await numbers.updateNumber(request);
    }catch(err){
        expect(err.message).to.include('are not compatible parameters')

    }
 })
 it('Should return error with no aorLink and ingressApp', async () =>{
    let request ={
    
    };
    const stubDb = sandbox.stub(numbers,'getNumber').returns({})
    const numberSpy = sinon.spy(numbers,'updateNumber')
    try{
        await numbers.updateNumber(request);
    }catch(err){
        expect(err.message).to.include('You must provider either')

    }
 })
 it('Should udpdate a number with aorLink', async () =>{
    let request ={
        aorLink:"x"
    };
    const returnNumberDb = new NumbersPB.Number();
    const stubDb = sandbox.stub(numbers,'getNumber').returns(returnNumberDb)
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        updateNumber:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(returnNumberDb)
            )}
        }
      });
    let result = await numbers.updateNumber(request);
    expect(result).to.be.equal(returnNumberDb);

 })
 it('Should udpdate a number with ingressApp', async () =>{
    let request ={
        ingressApp:"test"
    };
    const returnNumberDb = new NumbersPB.Number();
    const stubDb = sandbox.stub(numbers,'getNumber').returns(returnNumberDb)
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        updateNumber:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(returnNumberDb)
            )}
        }
      });
    let result = await numbers.updateNumber(request);
    expect(result).to.be.equal(returnNumberDb);

 })

 it('Should return an app', async () =>{

    const returnApp = new AppManagerPB.App()
    const stubNumber = sandbox.stub(FonosService.prototype,'getService').returns({
        getIngressApp:() =>{
          return{
            sendMessage: ((r: any) => Promise.resolve(returnApp)
            )}
        }
      });
    let result = await numbers.getIngressApp("ref");
    expect(result).to.be.equal(returnApp);

 })

}) 
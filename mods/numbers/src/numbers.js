const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { AbstractService, NumbersService, NumbersPB } = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll
const { getClientCredentials } = require('@yaps/core').trust_util

class Numbers extends AbstractService {
  constructor (options) {
    super(options, NumbersService.NumbersClient)
    promisifyAll(super.getService(), { metadata: super.getMeta() })
  }

  async createNumber (request) {
    logger.log(
      'verbose',
      `@yaps/numbers createNumber [request: ${JSON.stringify(request)}]`
    )
    logger.log(
      'debug',
      `@yaps/numbers createNumber [validating number:  ${request.e164Number}]`
    )

    // TODO: Validate number

    const number = new NumbersPB.Number()
    number.setE164Number(request.e164Number)
    number.setIngressApp(request.ingressApp)

    const req = new NumbersPB.CreateNumberRequest()
    req.setNumber(number)

    return super
      .getService()
      .createNumber()
      .sendMessage(req)
  }

  async getIngressApp (request) {
    logger.log(
      'verbose',
      `@yaps/numbers getIngressApp [request: ${JSON.stringify(request)}]`
    )
    logger.log(
      'debug',
      `@yaps/numbers getIngressApp [validating number:  ${request.e164Number}]`
    )

    const req = new NumbersPB.GetIngressAppRequest()
    req.setE164Number(request.e164Number)

    return super
      .getService()
      .getIngressApp()
      .sendMessage(req)
  }

  async getIngressAppSync (request) {
    const sleep = require('sync').sleep
    let result
    let error
    this.getIngressApp(request)
      .then(r => (result = r))
      .catch(e => (error = e))

    while (result === undefined && error === undefined) sleep(100)

    if (error) throw error

    return result
  }
}

module.exports = Numbers

const { grpc } = require('@yaps/core')
const { logger } = require('@yaps/core')
const { AbstractService, NumbersService, NumbersPB } = require('@yaps/core')
const promisifyAll = require('grpc-promise').promisifyAll
const { getClientCredentials } = require('@yaps/core').trust_util

class Numbers extends AbstractService {
  constructor (options) {
    super(options)

    const metadata = new grpc.Metadata()
    metadata.add('access_key_id', super.getOptions().accessKeyId)
    metadata.add('access_key_secret', super.getOptions().accessKeySecret)

    const credentials = grpc.credentials.createInsecure()

    logger.log(
      'info',
      `Connecting with API Server @ ${super.getOptions().endpoint}`
    )

    const service = new NumbersService.NumbersClient(
      super.getOptions().endpoint,
      credentials
    )

    promisifyAll(service, { metadata })

    this.createNumber = request => {
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

      return service.createNumber().sendMessage(req)
    }

    this.getIngressApp = request => {
      logger.log(
        'verbose',
        `@yaps/numbers getIngressApp [request: ${JSON.stringify(request)}]`
      )
      logger.log(
        'debug',
        `@yaps/numbers getIngressApp [validating number:  ${
          request.e164Number
        }]`
      )

      const req = new NumbersPB.GetIngressAppRequest()
      req.setE164Number(request.e164Number)

      return service.getIngressApp().sendMessage(req)
    }

    this.getIngressAppSync = request => {
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
}

module.exports = Numbers

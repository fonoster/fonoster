import logger from '@fonos/logger'
import { GetObjectURLResponse } from './protos/storage_pb'

const getObjectURL = (call: { request: { getName: () => any; getBucket: () => any } }, callback: (arg0: any, arg1: GetObjectURLResponse) => void) => {
  logger.log(
    'debug',
    `@fonos/core getObjectURL [request: ${call.request.getName()}]`
  )

  const response:GetObjectURLResponse = new GetObjectURLResponse()
  response.setUrl('pura cebadera')
  callback(null, response)
}

export { getObjectURL }
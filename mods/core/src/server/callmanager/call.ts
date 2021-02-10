import { CallRequest, CallResponse } from '../protos/callmanager_pb'
import { FonosError } from '@fonos/errors'
import phone from 'phone'
export interface EndpointInfo {
  domain: string
  trunk: string
  context: string
  extension: string
}

export default async function (
  request: CallRequest,
  channel: any,
  endpointInfo: EndpointInfo
): Promise<CallResponse> {
  if (phone(request.getFrom()).length === 0)
    throw new FonosError('invalid e164 number')
  if (phone(request.getTo()).length === 0)
    throw new FonosError('invalid e164 number')
  if (!request.getApp()) throw new FonosError('invalid app reference')

  const response = new CallResponse()
  response.setFrom(phone(request.getFrom())[0])
  response.setTo(phone(request.getTo())[0])
  response.setApp(request.getApp())
  response.setDuration(0)

  // Removing the '+' sign
  const from = response.getFrom().substring(1, response.getFrom().length)
  const to = response.getTo().substring(1, response.getTo().length)

  await channel.originate({
    context: endpointInfo.context,
    extension: endpointInfo.extension,
    endpoint: `PJSIP/${endpointInfo.trunk}/sip:${to}@${endpointInfo.domain}`,
    variables: { DID_INFO: `<sip:${from}@anonymous.invalid>` }
  })

  return response
}

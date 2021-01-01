import { Number as DID } from '../../server/protos/numbers_pb'

export default function (jsonObj: any) {
  const number = new DID()
  const location = jsonObj.spec.location
  number.setRef(jsonObj.metadata.ref)
  number.setProviderRef(jsonObj.metadata.gwRef)
  number.setIngressApp(jsonObj.metadata.ingressApp)
  number.setAorLink(location.aorLink)
  number.setCreateTime(jsonObj.metadata.createdOn)
  number.setUpdateTime(jsonObj.metadata.modifiedOn)
  number.setE164Number(location.telUrl.split(':')[1])
  return number
}

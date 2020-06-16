import routr from '../../common/routr'

export default async function (resource: any, decoder: Function) {
  await routr.connect()
  const ref = await routr.resourceType('agents').update(resource)
  const jsonObj = await routr.resourceType('agents').get(ref)
  return decoder(jsonObj)
}

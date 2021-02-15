import routr from '../../common/routr'

export default async function (accessKeyId: string, resource: any, decoder: Function) {
  await routr.connect()
  if (resource.metadata.accessKeyId === accessKeyId) {
    const ref = await routr.resourceType('agents').update(resource)
    const jsonObj = await routr.resourceType('agents').get(ref)
    return decoder(jsonObj)
  }
  return null
}

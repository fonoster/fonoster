import { App } from '../protos/appmanager_pb'

export default function (jsonObj: any) {
  const app = new App()
  app.setAccountId(jsonObj.accountKeyId)
  app.setRef(jsonObj.ref)
  app.setStatus(jsonObj.status)
  app.setName(jsonObj.name)
  app.setBucket(jsonObj.bucket)
  app.setDescription(jsonObj.description)
  app.setCreateTime(jsonObj.createTime)
  app.setUpdateTime(jsonObj.updateTime)
  return app
}

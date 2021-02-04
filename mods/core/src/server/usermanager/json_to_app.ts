import { App } from '../protos/appmanager_pb'

export default function (jsonObj: any) {
  const app = new App()
  app.setStatus(jsonObj.status)
  app.setName(jsonObj.name)
  app.setBucket(jsonObj.bucket)
  app.setDescription(jsonObj.description)
  app.setCreateTime(jsonObj.createTime)
  app.setUpdateTime(jsonObj.updateTime)
  return app
}

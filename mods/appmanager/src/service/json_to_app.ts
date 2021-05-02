import {App} from "./protos/appmanager_pb";

export default function (jsonObj: any) {
  const app = new App();
  app.setAccessKeyId(jsonObj.accessKeyId);
  app.setRef(jsonObj.ref);
  app.setStatus(jsonObj.status);
  app.setName(jsonObj.name);
  app.setDescription(jsonObj.description);
  app.setCreateTime(jsonObj.createTime);
  app.setUpdateTime(jsonObj.updateTime);
  return app;
}

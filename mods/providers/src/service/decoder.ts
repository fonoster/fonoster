import { Provider } from "./protos/providers_pb";

export default function (jsonObj: any) {
  const provider = new Provider();
  const spec = jsonObj?.spec;

  provider.setRef(jsonObj.metadata.ref);
  provider.setName(jsonObj.metadata.name);
  provider.setCreateTime(jsonObj.metadata.createdOn);
  provider.setUpdateTime(jsonObj.metadata.modifiedOn);
  provider.setHost(spec?.host);
  provider.setTransport(spec?.transport);
  provider.setExpires(spec?.expires);

  if (spec.credentials) {
    provider.setUsername(spec.credentials.username);
    provider.setSecret(spec.credentials.secret);
  }

  return provider;
}

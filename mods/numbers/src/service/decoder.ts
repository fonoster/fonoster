/* eslint-disable require-jsdoc */
import NumbersPB from "./protos/numbers_pb";

export default function (jsonObj: any): NumbersPB.Number {
  const number = new NumbersPB.Number();
  const location = jsonObj?.spec?.location;
  const ingressInfo = new NumbersPB.IngressInfo();

  ingressInfo.setWebhook(jsonObj.metadata?.webhook);
  ingressInfo.setAppRef(jsonObj.metadata?.appRef);
  ingressInfo.setAccessKeyId(jsonObj.metadata?.accessKeyId);
  number.setRef(jsonObj.metadata.ref);
  number.setProviderRef(jsonObj.metadata.gwRef);
  number.setIngressInfo(ingressInfo);
  number.setAorLink(location?.aorLink);
  number.setCreateTime(jsonObj.metadata.createdOn);
  number.setUpdateTime(jsonObj.metadata.modifiedOn);
  number.setE164Number(location?.telUrl?.split(":")?.[1]);

  return number;
}

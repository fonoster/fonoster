/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  ListNumbersRequest,
  UpdateNumberResponse,
  CreateNumberRequest,
  UpdateNumberRequest,
  CreateNumberResponse,
  GetNumberResponse,
  DeleteNumberResponse,
  ListNumbersResponse,
  GetIngressInfoRequest,
  GetIngressInfoResponse,
  INumbersClient,
  Number
} from "./types";
import { APIClient, ClientOptions } from "@fonoster/common";
import { NumbersClient } from "../service/protos/numbers_grpc_pb";
import NumbersPB, { IngressInfo } from "../service/protos/numbers_pb";
import CommonPB from "../service/protos/common_pb";
import { promisifyAll } from "grpc-promise";

/**
 * @classdesc Use Fonoster Numbers, a capability of Fonoster SIP Proxy subsystem,
 * to create, update, get and delete numbers. Fonoster Numbers requires of a
 * running Fonoster deployment.
 *
 * @extends APIClient
 * @example
 *
 * const Fonoster = require("@fonoster/sdk");
 * const numbers = new Fonoster.Numbers();
 *
 * const request = {
 *   providerRef: "516f1577bcf86cd797439012",
 *   e164Number: "+17853177343",
 *   ingressInfo: {
 *     webhook: "https://webhooks.acme.com/hooks"
 *   }
 * };
 *
 * numbers.createNumber(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Numbers extends APIClient implements INumbersClient {
  /**
   * Constructs a new Numbers object.
   * @param {ClientOptions} options - Options to indicate the objects endpoint
   * @see module:core:APIClient
   */
  constructor(options?: ClientOptions) {
    super(NumbersClient, options);
    super.init();
    promisifyAll(super.getService(), { metadata: super.getMeta() });
  }

  /**
   * Creates a new Number on the SIP Proxy subsystem.
   *
   * @param {CreateNumberRequest} request -  Request for the provision of a new Number
   * @param {string} request.providerRef - Idenfier to the Provider this Number belongs
   * with
   * @param {string} request.e164Number - A valid number @ Provider
   * @param {string} request.aorLink - An AOR where ingress calls will be
   * directed to
   * @param {string} request.ingressInfo - Webhook to connect call to
   * @note You can only provider an aorLink or an ingressInfo but no both
   * @return {Promise<CreateNumberResponse>}
   * @example
   *
   * const request = {
   *   providerRef: "516f1577bcf86cd797439012",
   *   e164Number: "+17853177343",
   *   aorLink: "sip:1001@sip.local"
   * };
   *
   * numbers.createNumber(request)
   * .then(result => {
   *   console.log(result)            // returns the CreateNumberResponse interface
   * }).catch(e => console.error(e));  // an error occurred
   */
  async createNumber(
    request: CreateNumberRequest
  ): Promise<CreateNumberResponse> {
    const ingressInfo = new NumbersPB.IngressInfo();
    ingressInfo.setWebhook(request?.ingressInfo?.webhook);
    ingressInfo.setAppRef(request?.ingressInfo?.appRef);
    const req = new NumbersPB.CreateNumberRequest();
    req.setProviderRef(request.providerRef);
    req.setE164Number(request.e164Number);
    req.setIngressInfo(ingressInfo);
    req.setAorLink(request.aorLink);

    const res = await super.getService().createNumber().sendMessage(req);

    return {
      ref: res.getRef()
    };
  }

  /**
   * Retrives a Number by its reference.
   *
   * @param {string} ref - Reference to Number
   * @return {Promise<GetNumberResponse>} The GetNumberResponse
   * @throws if ref is null or Number does not exist
   * @example
   *
   * numbers.getNumber(ref)
   * .then(result => {
   *   console.log(result)             // returns the GetNumberResponse object
   * }).catch(e => console.error(e));   // an error occurred
   */
  async getNumber(ref: string): Promise<GetNumberResponse> {
    const req = new NumbersPB.GetNumberRequest();
    req.setRef(ref);
    const res = await this.getService().getNumber().sendMessage(req);
    return {
      aorLink: res.getAorLink(),
      e164Number: res.getE164Number(),
      ingressInfo: {
        webhook: res.getIngressInfo()?.getWebhook(),
        appRef: res.getIngressInfo()?.getAppRef()
      },
      providerRef: res.getProviderRef(),
      ref: res.getRef(),
      createTime: res.getCreateTime(),
      updateTime: res.getUpdateTime()
    };
  }

  /**
   * Update a Number at the SIP Proxy subsystem.
   *
   * @param {UpdateNumberRequest} request - Request for the update of an existing Number
   * @param {string} request.aorLink - An AOR where ingress calls will be
   * directed to
   * @param {string} request.ingressInfo - A webhook to direct the call for flow control
   * @note You can only provider an aorLink or an ingressApp but no both
   * @return {Promise<UpdateNumberResponse>}
   * @example
   *
   * const request = {
   *   ref: "516f1577bcf86cd797439012",
   *   aorLink: "sip:1001@sip.local"
   * };
   *
   * numbers.updateNumber(request)
   * .then(result => {
   *   console.log(result)            // returns the Number from the DB
   * }).catch(e => console.error(e));  // an error occurred
   */
  async updateNumber(
    request: UpdateNumberRequest
  ): Promise<UpdateNumberResponse> {
    const ingressInfo = new IngressInfo();
    ingressInfo.setWebhook(request?.ingressInfo?.webhook);
    ingressInfo.setAppRef(request?.ingressInfo?.appRef);

    const req = new NumbersPB.UpdateNumberRequest();
    req.setRef(request.ref);
    req.setAorLink(request.aorLink);

    if (ingressInfo.getAppRef() || ingressInfo.getWebhook())
      req.setIngressInfo(ingressInfo);

    const result = await super.getService().updateNumber().sendMessage(req);

    const response: UpdateNumberResponse = {
      ref: result.getRef()
    };
    return response;
  }

  /**
   * List the Numbers registered in Fonoster SIP Proxy subsystem.
   *
   * @param {ListNumbersRequest} request
   * @param {number} request.pageSize - Number of element per page
   * (defaults to 20)
   * @param {string} request.pageToken - The next_page_token value returned from
   * a previous List request, if any
   * @return {Promise<ListNumbersResponse>} List of Numbers
   * @example
   *
   * const request = {
   *    pageSize: 20,
   *    pageToken: 2
   * };
   *
   * numbers.listNumbers(request)
   * .then(() => {
   *   console.log(result)            // returns a ListNumbersResponse object
   * }).catch(e => console.error(e));  // an error occurred
   */
  async listNumbers(request: ListNumbersRequest): Promise<ListNumbersResponse> {
    const r = new NumbersPB.ListNumbersRequest();
    r.setPageSize(request.pageSize);
    r.setPageToken(request.pageToken);
    r.setView(request.view);
    const paginatedList = await this.getService().listNumbers().sendMessage(r);
    return {
      nextPageToken: paginatedList.getNextPageToken(),
      numbers: paginatedList.getNumbersList().map((n: NumbersPB.Number) => {
        return {
          ref: n.getRef(),
          providerRef: n.getProviderRef(),
          e164Number: n.getE164Number(),
          ingressInfo: {
            webhook: n.getIngressInfo() ? n.getIngressInfo().getWebhook() : null
          },
          aorLink: n.getAorLink(),
          createTime: n.getCreateTime(),
          updateTime: n.getUpdateTime()
        };
      })
    };
  }

  /**
   * Deletes a Number from SIP Proxy subsystem.
   *
   * @param {string} ref - Reference to the Number
   * @example
   *
   * const ref = "cb8V0CNTfH";
   *
   * numbers.deleteNumber(ref)
   * .then(() => {
   *   console.log("done")            // returns an empty object
   * }).catch(e => console.error(e))  // an error occurred
   */
  async deleteNumber(ref: string): Promise<DeleteNumberResponse> {
    const req = new NumbersPB.DeleteNumberRequest();
    req.setRef(ref);

    await super.getService().deleteNumber().sendMessage(req);

    return {
      ref
    };
  }

  /**
   * Get the Ingress App for a given e164 number.
   *
   * @param {GetIngressAppRequest} request
   * @param {string} request.e164Number - A number in E164 format for
   * incomming calls
   * @return {Promise<GetIngressAppResponse>}
   * @throws if the Number is not register in Fonoster
   * @example
   *
   * const request = {
   *    e164Number: "+17853178071"
   * };
   *
   * numbers.getIngressApp(request)
   * .then(result => {
   *   console.log(result)            // returns the Application
   * }).catch(e => console.error(e));  // an error occurred
   */
  async getIngressInfo(
    request: GetIngressInfoRequest
  ): Promise<GetIngressInfoResponse> {
    const req = new NumbersPB.GetIngressInfoRequest();
    req.setE164Number(request.e164Number);

    const result = await super.getService().getIngressInfo().sendMessage(req);

    return {
      webhook: result.getWebhook(),
      accessKeyId: result.getAccessKeyId(),
      appRef: result.getAppRef()
    };
  }
}

export { Number, NumbersPB, CommonPB, INumbersClient };

// WARNING: Workaround for support to commonjs clients
module.exports = Numbers;
module.exports.Number = Number;
module.exports.NumbersPB = NumbersPB;
module.exports.CommonPB = CommonPB;

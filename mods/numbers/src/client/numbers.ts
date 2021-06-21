/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
  GetIngressInfoResponse
} from "./types";
import {FonosService, ServiceOptions} from "@fonos/common";
import {NumbersClient} from "../service/protos/numbers_grpc_pb";
import NumbersPB, {IngressInfo} from "../service/protos/numbers_pb";
import CommonPB from "../service/protos/common_pb";
import {promisifyAll} from "grpc-promise";
import grpc from "grpc";

/**
 * @classdesc Use Fonos Numbers, a capability of Fonos SIP Proxy subsystem,
 * to create, update, get and delete numbers. Fonos Numbers requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require("@fonos/sdk");
 * const numbers = new Fonos.Numbers();
 *
 * const request = {
 *   providerRef: "516f1577bcf86cd797439012",
 *   e164Number: "+17853177343",
 *   ingressInfo: {
 *      webhook: "https://webhooks.acme.com/hooks"
 *   }
 * };
 *
 * numbers.createNumber(request)
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e));   // an error occurred
 */
export default class Numbers extends FonosService {
  /**
   * Constructs a new Numbers object.
   * @param {ServiceOptions} options - Options to indicate the objects endpoint
   * @see module:core:FonosService
   */
  constructor(options: ServiceOptions = {}) {
    super(NumbersClient, options);
    super.init(grpc);
    promisifyAll(super.getService(), {metadata: super.getMeta()});
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
    const number = new NumbersPB.Number();
    const ingressInfo = new NumbersPB.IngressInfo();
    ingressInfo.setWebhook(
      request.ingressInfo ? request.ingressInfo.webhook : null
    );
    number.setProviderRef(request.providerRef);
    number.setE164Number(request.e164Number);
    number.setIngressInfo(ingressInfo);
    number.setAorLink(request.aorLink);

    const req = new NumbersPB.CreateNumberRequest();
    req.setNumber(number);

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
        webhook: res.getIngressInfo() ? res.getIngressInfo().getWebhook : null
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
    const getRequest = new NumbersPB.GetNumberRequest();
    getRequest.setRef(request.ref);
    const numberFromDB = await this.getService()
      .getNumber()
      .sendMessage(getRequest);

    if (request.aorLink && request.ingressInfo) {
      throw new Error(
        "'ingressApp' and 'aorLink' are not compatible parameters"
      );
    } else if (!request.aorLink && !request.ingressInfo) {
      throw new Error(
        "You must provider either an 'ingressApp' or and 'aorLink'"
      );
    }

    if (request.aorLink) {
      numberFromDB.setAorLink(request.aorLink);
      numberFromDB.setIngressInfo(undefined);
    } else {
      numberFromDB.setAorLink(undefined);
      const ingressInfo = new IngressInfo();
      ingressInfo.setWebhook(
        request.ingressInfo ? request.ingressInfo.webhook : null
      );
      numberFromDB.setIngressInfo(ingressInfo);
    }
    const req = new NumbersPB.UpdateNumberRequest();
    req.setNumber(numberFromDB);

    const result = await super.getService().updateNumber().sendMessage(req);

    const response: UpdateNumberResponse = {
      ref: result.getRef()
    };
    return response;
  }

  /**
   * List the Numbers registered in Fonos SIP Proxy subsystem.
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
   * @throws if the Number is not register in Fonos
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
      accessKeyId: result.getAccessKeyId()
    };
  }
}

export {NumbersPB, CommonPB};

// WARNING: Workaround for support to commonjs clients
module.exports = Numbers;
module.exports.NumbersPB = NumbersPB;
module.exports.CommonPB = CommonPB;
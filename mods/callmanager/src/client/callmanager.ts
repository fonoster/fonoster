import {
  FonosService,
  ServiceOptions
} from "@fonos/core";
import {
  CallManagerService
} from "../service/protos/callmanager_grpc_pb";
import CallManagerPB from "../service/protos/callmanager_pb";
import {promisifyAll} from "grpc-promise";

/**
 * Call request object
 *
 * @typedef {Object} CallRequest
 * @property {string} from - Point of origination for the call.
 * @property {string} to - Destination number.
 * @property {string} app - Application to handle the call once the destination answers the call
 */
export interface CallRequest {
  from: string;
  to: string;
  app: string;
}

/**
 * Call response object
 *
 * @typedef {Object} CallResponse
 * @property {string} from - Point of origination for the call.
 * @property {string} to - Destination number.
 * @property {string} app - Application to handle the call once the destination answers the call
 */
export interface CallResponse {
  from: string;
  to: string;
  app: string;
  duration: number;
}

/**
 * @classdesc Use Fonos CallManager, a capability of Fonos Systems Manager,
 * to initiate and monitor automated calls. Fonos CallManager requires of a
 * running Fonos deployment.
 *
 * @extends FonosService
 * @example
 *
 * const Fonos = require('@fonos/sdk')
 * const callManager = new Fonos.CallManager()
 *
 * callManager.call({
 *   from: '9102104343',
 *   to: '17853178070'
 *   app: 'default'
 * })
 * .then(result => {
 *   console.log(result)             // successful response
 * }).catch(e => console.error(e))   // an error occurred
 */
export default class CallManager extends FonosService {
  /**
   * Constructs a new CallManager Object.
   *
   * @see module:core:FonosService
   */
  constructor(options?: ServiceOptions) {
    super(CallManagerService.CallManagerClient, options);
    super.init();
    promisifyAll(super.getService(), {metadata: super.getMeta()});
  }

  /**
   * Calls method.
   *
   * @param {CallRequest} request - call options.
   * @return {Promise<CallResponse>} call results
   * @throws if the from number doesn't exist
   * @throws if could not connect to the underline services
   * @example
   *
   * callManager.call({
   *   from: '9102104343',
   *   to: '17853178070'
   *   app: 'default'
   * })
   * .then(result => {
   *   console.log(result)             // successful response
   * }).catch(e => console.error(e))   // an error occurred
   *
   */
  async call(request: CallRequest): Promise<CallResponse> {
    const r = new CallManagerPB.CallRequest();
    r.setFrom(request.from);
    r.setTo(request.to);
    r.setApp(request.app);

    const p = await super.getService().call().sendMessage(r);

    return {
      from: p.getFrom(),
      to: p.getTo(),
      app: p.getApp(),
      duration: p.getDuration()
    };
  }
}

export {CallManagerPB}
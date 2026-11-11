// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
// http://github.com/fonoster/fonoster
//
// This file is part of Fonoster
//
// Licensed under the MIT License (the "License");
// you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
//
//    https://opensource.org/licenses/MIT
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';
var grpc = require('@grpc/grpc-js');
var billing_pb = require('./billing_pb.js');

function serialize_fonoster_billing_v1beta2_BillingSummary(arg) {
  if (!(arg instanceof billing_pb.BillingSummary)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.BillingSummary');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_BillingSummary(buffer_arg) {
  return billing_pb.BillingSummary.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_CreatePortalSessionRequest(arg) {
  if (!(arg instanceof billing_pb.CreatePortalSessionRequest)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.CreatePortalSessionRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_CreatePortalSessionRequest(buffer_arg) {
  return billing_pb.CreatePortalSessionRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_CreatePortalSessionResponse(arg) {
  if (!(arg instanceof billing_pb.CreatePortalSessionResponse)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.CreatePortalSessionResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_CreatePortalSessionResponse(buffer_arg) {
  return billing_pb.CreatePortalSessionResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_CreateTopUpRequest(arg) {
  if (!(arg instanceof billing_pb.CreateTopUpRequest)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.CreateTopUpRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_CreateTopUpRequest(buffer_arg) {
  return billing_pb.CreateTopUpRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_GetBillingRequest(arg) {
  if (!(arg instanceof billing_pb.GetBillingRequest)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.GetBillingRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_GetBillingRequest(buffer_arg) {
  return billing_pb.GetBillingRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_SubscribeRequest(arg) {
  if (!(arg instanceof billing_pb.SubscribeRequest)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.SubscribeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_SubscribeRequest(buffer_arg) {
  return billing_pb.SubscribeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_billing_v1beta2_UpdateAutoRechargeRequest(arg) {
  if (!(arg instanceof billing_pb.UpdateAutoRechargeRequest)) {
    throw new Error('Expected argument of type fonoster.billing.v1beta2.UpdateAutoRechargeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_billing_v1beta2_UpdateAutoRechargeRequest(buffer_arg) {
  return billing_pb.UpdateAutoRechargeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// Billing for Fonoster Cloud (add-billing-service): the owner's credits, plan, auto-recharge,
// top-ups and the Stripe Customer Portal. The billing service serves it with owner_ref set; the
// apiserver serves it to the dashboard for workspace owners and sets owner_ref from the caller.
var BillingService = exports.BillingService = {
  // The balance by source, the plan and auto-recharge
getBilling: {
    path: '/fonoster.billing.v1beta2.Billing/GetBilling',
    requestStream: false,
    responseStream: false,
    requestType: billing_pb.GetBillingRequest,
    responseType: billing_pb.BillingSummary,
    requestSerialize: serialize_fonoster_billing_v1beta2_GetBillingRequest,
    requestDeserialize: deserialize_fonoster_billing_v1beta2_GetBillingRequest,
    responseSerialize: serialize_fonoster_billing_v1beta2_BillingSummary,
    responseDeserialize: deserialize_fonoster_billing_v1beta2_BillingSummary,
  },
  // Turns auto-recharge on or off, with its threshold and amount in credits
updateAutoRecharge: {
    path: '/fonoster.billing.v1beta2.Billing/UpdateAutoRecharge',
    requestStream: false,
    responseStream: false,
    requestType: billing_pb.UpdateAutoRechargeRequest,
    responseType: billing_pb.BillingSummary,
    requestSerialize: serialize_fonoster_billing_v1beta2_UpdateAutoRechargeRequest,
    requestDeserialize: deserialize_fonoster_billing_v1beta2_UpdateAutoRechargeRequest,
    responseSerialize: serialize_fonoster_billing_v1beta2_BillingSummary,
    responseDeserialize: deserialize_fonoster_billing_v1beta2_BillingSummary,
  },
  // Buys top-up credits; they are added once the payment succeeds
createTopUp: {
    path: '/fonoster.billing.v1beta2.Billing/CreateTopUp',
    requestStream: false,
    responseStream: false,
    requestType: billing_pb.CreateTopUpRequest,
    responseType: billing_pb.BillingSummary,
    requestSerialize: serialize_fonoster_billing_v1beta2_CreateTopUpRequest,
    requestDeserialize: deserialize_fonoster_billing_v1beta2_CreateTopUpRequest,
    responseSerialize: serialize_fonoster_billing_v1beta2_BillingSummary,
    responseDeserialize: deserialize_fonoster_billing_v1beta2_BillingSummary,
  },
  // Moves the owner to Pay-as-you-go (needs a payment method, added in the portal)
subscribe: {
    path: '/fonoster.billing.v1beta2.Billing/Subscribe',
    requestStream: false,
    responseStream: false,
    requestType: billing_pb.SubscribeRequest,
    responseType: billing_pb.BillingSummary,
    requestSerialize: serialize_fonoster_billing_v1beta2_SubscribeRequest,
    requestDeserialize: deserialize_fonoster_billing_v1beta2_SubscribeRequest,
    responseSerialize: serialize_fonoster_billing_v1beta2_BillingSummary,
    responseDeserialize: deserialize_fonoster_billing_v1beta2_BillingSummary,
  },
  // A Stripe Customer Portal link for payment methods and invoices
createPortalSession: {
    path: '/fonoster.billing.v1beta2.Billing/CreatePortalSession',
    requestStream: false,
    responseStream: false,
    requestType: billing_pb.CreatePortalSessionRequest,
    responseType: billing_pb.CreatePortalSessionResponse,
    requestSerialize: serialize_fonoster_billing_v1beta2_CreatePortalSessionRequest,
    requestDeserialize: deserialize_fonoster_billing_v1beta2_CreatePortalSessionRequest,
    responseSerialize: serialize_fonoster_billing_v1beta2_CreatePortalSessionResponse,
    responseDeserialize: deserialize_fonoster_billing_v1beta2_CreatePortalSessionResponse,
  },
};

exports.BillingClient = grpc.makeGenericClientConstructor(BillingService, 'Billing');

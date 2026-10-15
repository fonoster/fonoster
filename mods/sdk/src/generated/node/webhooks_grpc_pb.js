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
var webhooks_pb = require('./webhooks_pb.js');

function serialize_fonoster_webhooks_v1beta2_CreateWebhookRequest(arg) {
  if (!(arg instanceof webhooks_pb.CreateWebhookRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.CreateWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_CreateWebhookRequest(buffer_arg) {
  return webhooks_pb.CreateWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_CreateWebhookResponse(arg) {
  if (!(arg instanceof webhooks_pb.CreateWebhookResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.CreateWebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_CreateWebhookResponse(buffer_arg) {
  return webhooks_pb.CreateWebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_DeleteWebhookRequest(arg) {
  if (!(arg instanceof webhooks_pb.DeleteWebhookRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.DeleteWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_DeleteWebhookRequest(buffer_arg) {
  return webhooks_pb.DeleteWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_DeleteWebhookResponse(arg) {
  if (!(arg instanceof webhooks_pb.DeleteWebhookResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.DeleteWebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_DeleteWebhookResponse(buffer_arg) {
  return webhooks_pb.DeleteWebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_GetWebhookRequest(arg) {
  if (!(arg instanceof webhooks_pb.GetWebhookRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.GetWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_GetWebhookRequest(buffer_arg) {
  return webhooks_pb.GetWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesRequest(arg) {
  if (!(arg instanceof webhooks_pb.ListWebhookDeliveriesRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.ListWebhookDeliveriesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesRequest(buffer_arg) {
  return webhooks_pb.ListWebhookDeliveriesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesResponse(arg) {
  if (!(arg instanceof webhooks_pb.ListWebhookDeliveriesResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.ListWebhookDeliveriesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesResponse(buffer_arg) {
  return webhooks_pb.ListWebhookDeliveriesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_ListWebhooksRequest(arg) {
  if (!(arg instanceof webhooks_pb.ListWebhooksRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.ListWebhooksRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_ListWebhooksRequest(buffer_arg) {
  return webhooks_pb.ListWebhooksRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_ListWebhooksResponse(arg) {
  if (!(arg instanceof webhooks_pb.ListWebhooksResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.ListWebhooksResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_ListWebhooksResponse(buffer_arg) {
  return webhooks_pb.ListWebhooksResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_ResendWebhookDeliveryRequest(arg) {
  if (!(arg instanceof webhooks_pb.ResendWebhookDeliveryRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.ResendWebhookDeliveryRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_ResendWebhookDeliveryRequest(buffer_arg) {
  return webhooks_pb.ResendWebhookDeliveryRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_RotateWebhookSecretRequest(arg) {
  if (!(arg instanceof webhooks_pb.RotateWebhookSecretRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.RotateWebhookSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_RotateWebhookSecretRequest(buffer_arg) {
  return webhooks_pb.RotateWebhookSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_RotateWebhookSecretResponse(arg) {
  if (!(arg instanceof webhooks_pb.RotateWebhookSecretResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.RotateWebhookSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_RotateWebhookSecretResponse(buffer_arg) {
  return webhooks_pb.RotateWebhookSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_UpdateWebhookRequest(arg) {
  if (!(arg instanceof webhooks_pb.UpdateWebhookRequest)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.UpdateWebhookRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_UpdateWebhookRequest(buffer_arg) {
  return webhooks_pb.UpdateWebhookRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_UpdateWebhookResponse(arg) {
  if (!(arg instanceof webhooks_pb.UpdateWebhookResponse)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.UpdateWebhookResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_UpdateWebhookResponse(buffer_arg) {
  return webhooks_pb.UpdateWebhookResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_Webhook(arg) {
  if (!(arg instanceof webhooks_pb.Webhook)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.Webhook');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_Webhook(buffer_arg) {
  return webhooks_pb.Webhook.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_webhooks_v1beta2_WebhookDelivery(arg) {
  if (!(arg instanceof webhooks_pb.WebhookDelivery)) {
    throw new Error('Expected argument of type fonoster.webhooks.v1beta2.WebhookDelivery');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_webhooks_v1beta2_WebhookDelivery(buffer_arg) {
  return webhooks_pb.WebhookDelivery.deserializeBinary(new Uint8Array(buffer_arg));
}


// Workspace webhooks (add-workspace-webhooks): endpoints, secret rotation and the delivery log
var WebhooksService = exports.WebhooksService = {
  // Create an endpoint; the response carries its signing secret (shown once)
createWebhook: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/CreateWebhook',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.CreateWebhookRequest,
    responseType: webhooks_pb.CreateWebhookResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_CreateWebhookRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_CreateWebhookRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_CreateWebhookResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_CreateWebhookResponse,
  },
  // List the workspace's endpoints
listWebhooks: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/ListWebhooks',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.ListWebhooksRequest,
    responseType: webhooks_pb.ListWebhooksResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_ListWebhooksRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_ListWebhooksRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_ListWebhooksResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_ListWebhooksResponse,
  },
  // Get one endpoint
getWebhook: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/GetWebhook',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.GetWebhookRequest,
    responseType: webhooks_pb.Webhook,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_GetWebhookRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_GetWebhookRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_Webhook,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_Webhook,
  },
  // Change an endpoint's URL or events
updateWebhook: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/UpdateWebhook',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.UpdateWebhookRequest,
    responseType: webhooks_pb.UpdateWebhookResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_UpdateWebhookRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_UpdateWebhookRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_UpdateWebhookResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_UpdateWebhookResponse,
  },
  // Delete an endpoint
deleteWebhook: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/DeleteWebhook',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.DeleteWebhookRequest,
    responseType: webhooks_pb.DeleteWebhookResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_DeleteWebhookRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_DeleteWebhookRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_DeleteWebhookResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_DeleteWebhookResponse,
  },
  // New signing secret; the previous one keeps verifying for 24 hours
rotateWebhookSecret: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/RotateWebhookSecret',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.RotateWebhookSecretRequest,
    responseType: webhooks_pb.RotateWebhookSecretResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_RotateWebhookSecretRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_RotateWebhookSecretRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_RotateWebhookSecretResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_RotateWebhookSecretResponse,
  },
  // The delivery log, newest first
listWebhookDeliveries: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/ListWebhookDeliveries',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.ListWebhookDeliveriesRequest,
    responseType: webhooks_pb.ListWebhookDeliveriesResponse,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesResponse,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_ListWebhookDeliveriesResponse,
  },
  // Send a delivery again now (same event id, fresh signature)
resendWebhookDelivery: {
    path: '/fonoster.webhooks.v1beta2.Webhooks/ResendWebhookDelivery',
    requestStream: false,
    responseStream: false,
    requestType: webhooks_pb.ResendWebhookDeliveryRequest,
    responseType: webhooks_pb.WebhookDelivery,
    requestSerialize: serialize_fonoster_webhooks_v1beta2_ResendWebhookDeliveryRequest,
    requestDeserialize: deserialize_fonoster_webhooks_v1beta2_ResendWebhookDeliveryRequest,
    responseSerialize: serialize_fonoster_webhooks_v1beta2_WebhookDelivery,
    responseDeserialize: deserialize_fonoster_webhooks_v1beta2_WebhookDelivery,
  },
};

exports.WebhooksClient = grpc.makeGenericClientConstructor(WebhooksService, 'Webhooks');

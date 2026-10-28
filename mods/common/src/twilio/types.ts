/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import RequestClient from "twilio/lib/base/RequestClient";

type TwilioLinkOptions = {
  /** Replaces twilio-node's HTTP client; tests pass the Twilio fake. */
  httpClient?: RequestClient;
};

type ProvisionTwilioTrunkParams = {
  phoneNumber: string;
  /** The lowercased workspace accessKeyId; names `Trunk-<label>`, `ACL-<label>`, `CL-<label>`. */
  label: string;
  originationUri: string;
  /** IPv4 addresses, with or without a `/n` CIDR suffix. */
  aclEntries: string[];
  sipCredential: { username: string; password: string };
};

type ProvisionTwilioTrunkResult = {
  twilioTrunkSid: string;
  terminationHost: string;
};

type AssignTwilioNumberToTrunkParams = {
  phoneNumber: string;
  twilioTrunkSid: string;
};

type RemoveOtherTwilioSipCredentialsParams = {
  label: string;
  keepUsername: string;
};

export {
  AssignTwilioNumberToTrunkParams,
  ProvisionTwilioTrunkParams,
  ProvisionTwilioTrunkResult,
  RemoveOtherTwilioSipCredentialsParams,
  TwilioLinkOptions
};

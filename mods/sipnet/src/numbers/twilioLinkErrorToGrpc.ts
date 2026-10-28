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
import { GrpcErrorMessage, TwilioLinkError } from "@fonoster/common";
import { status } from "@grpc/grpc-js";

const UNAVAILABLE: GrpcErrorMessage = {
  code: status.UNAVAILABLE,
  message: "Twilio is unavailable; try again"
};

// What a key without the permission for a Twilio call can't do, by the call's prefix
function missingPermission(step = ""): string {
  if (step.startsWith("sip.")) {
    return "manage SIP IP access control lists and credential lists";
  }
  if (step.startsWith("incomingPhoneNumbers.")) {
    return "read or update phone numbers";
  }
  return "manage Elastic SIP Trunking";
}

/**
 * The gRPC error for a failed Twilio call. Clients place errors by these messages, so they are
 * part of the contract. Twilio's own text never reaches the caller or the logs, and anything
 * unrecognized is reported as Twilio being unavailable.
 */
function twilioLinkErrorToGrpc(
  error: unknown,
  context: { accountSid: string; phoneNumber: string; label: string }
): GrpcErrorMessage {
  if (!(error instanceof TwilioLinkError)) {
    return UNAVAILABLE;
  }

  const failedPrecondition = (message: string) => ({
    code: status.FAILED_PRECONDITION,
    message
  });

  switch (error.reason) {
    case "INVALID_CREDENTIALS":
      return { code: status.INVALID_ARGUMENT, message: error.message };
    case "CREDENTIALS_REFUSED":
      return failedPrecondition("Twilio didn't accept these credentials");
    case "PERMISSION_MISSING":
      return failedPrecondition(
        `This Twilio key can't ${missingPermission(error.step)}. Twilio's Restricted keys can't link numbers; use a Standard API key or the Auth Token`
      );
    case "NUMBER_NOT_FOUND":
      return failedPrecondition(
        `${context.phoneNumber} isn't in Twilio account AC…${context.accountSid.slice(-4)}`
      );
    case "DOMAIN_TAKEN":
      return failedPrecondition(
        `Another Twilio account already uses ${context.label}.pstn.twilio.com; link from the Twilio account this workspace linked first`
      );
    default:
      return UNAVAILABLE;
  }
}

export { twilioLinkErrorToGrpc };

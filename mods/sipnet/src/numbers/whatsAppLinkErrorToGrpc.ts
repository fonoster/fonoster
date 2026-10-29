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
import { GrpcErrorMessage, WhatsAppLinkError } from "@fonoster/common";
import { status } from "@grpc/grpc-js";

const UNAVAILABLE: GrpcErrorMessage = {
  code: status.UNAVAILABLE,
  message: "Meta is unavailable; try again"
};

/**
 * The gRPC error for a failed Meta call. Clients place errors by these messages, so they are part
 * of the contract. Meta's own text never reaches the caller except for the tier check, and
 * anything unrecognized is reported as Meta being unavailable.
 */
function whatsAppLinkErrorToGrpc(
  error: unknown,
  context: { phoneNumberId: string; hostname: string }
): GrpcErrorMessage {
  if (!(error instanceof WhatsAppLinkError)) {
    return UNAVAILABLE;
  }

  const failedPrecondition = (message: string) => ({
    code: status.FAILED_PRECONDITION,
    message
  });

  switch (error.reason) {
    case "INVALID_CREDENTIALS":
      return { code: status.INVALID_ARGUMENT, message: error.message };
    case "TOKEN_REFUSED":
      return failedPrecondition("Meta didn't accept this access token");
    case "PERMISSION_MISSING":
      return failedPrecondition(
        "This access token can't manage WhatsApp calling settings; use a System User token with whatsapp_business_management"
      );
    case "NUMBER_NOT_FOUND":
      return failedPrecondition(
        `No WhatsApp number with id ${context.phoneNumberId} is reachable with this access token`
      );
    case "TIER_TOO_LOW":
      return failedPrecondition(error.message);
    case "SIP_SERVER_REJECTED":
      return failedPrecondition(
        `Meta didn't accept ${context.hostname} as the SIP server`
      );
    default:
      return UNAVAILABLE;
  }
}

export { whatsAppLinkErrorToGrpc };

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
import { randomBytes } from "node:crypto";
import net from "node:net";
import {
  assignTwilioNumberToTrunk,
  getAccessKeyIdFromCall,
  GrpcError,
  GrpcErrorMessage,
  NumberPreconditionsCheck,
  provisionTwilioTrunk,
  removeOtherTwilioSipCredentials,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  CreateTrunkRequestExtended,
  CredentialsApi,
  LinkTwilioRequest,
  LinkTwilioResponse,
  NumbersApi,
  Transport,
  TrunkApi
} from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { phone } from "phone";
import { CheckRefs, numberRefs } from "../resources/checkRefs";
import { mergeTrunkUpdate } from "../trunks/operations";
import {
  convertToRoutrNumber,
  convertToRoutrNumberUpdate
} from "./convertToRoutrNumber";
import { NumberRouting } from "./engineRouting";
import { findOwned, generatePassword } from "./linkShared";
import { twilioLinkErrorToGrpc } from "./twilioLinkErrorToGrpc";

const logger = getLogger({ service: "sipnet", filePath: __filename });

const TWILIO_PSTN_URI_BASE = "pstn.twilio.com";
type TwilioLink = {
  provisionTwilioTrunk: typeof provisionTwilioTrunk;
  assignTwilioNumberToTrunk: typeof assignTwilioNumberToTrunk;
  removeOtherTwilioSipCredentials: typeof removeOtherTwilioSipCredentials;
};

type LinkTwilioDeps = {
  numbers: NumbersApi;
  trunks: TrunkApi;
  credentials: CredentialsApi;
  checkNumberPreconditions: NumberPreconditionsCheck;
  routing?: NumberRouting;
  checkRefs?: CheckRefs;
  /** Where carriers reach this install's trunks (`pstn.<domain>`). */
  pstnRoot: string;
  /** The install's public signaling addresses; only IPv4 literals are allowed in Twilio. */
  signalingAddresses: string[];
  twilio?: TwilioLink;
};

const isIpv4Entry = (address: string) => {
  const [ip, prefix, ...rest] = address.split("/");
  return (
    rest.length === 0 &&
    net.isIPv4(ip) &&
    (prefix === undefined || (/^\d{1,2}$/.test(prefix) && +prefix <= 32))
  );
};

function linkTwilio(deps: LinkTwilioDeps) {
  const {
    numbers,
    trunks,
    credentials,
    checkNumberPreconditions,
    routing,
    checkRefs,
    pstnRoot,
    twilio = {
      provisionTwilioTrunk,
      assignTwilioNumberToTrunk,
      removeOtherTwilioSipCredentials
    }
  } = deps;
  const aclEntries = deps.signalingAddresses.filter(isIpv4Entry);

  const fn = async (
    call: { request: LinkTwilioRequest },
    callback: (error?: GrpcErrorMessage, response?: LinkTwilioResponse) => void
  ) => {
    const { request } = call;
    const { phoneNumber, appRef, agentAor } = request;
    const twilioCredentials = request.credentials;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    const label = accessKeyId.toLowerCase();
    const inboundUri = `${label}.${pstnRoot}`;
    const telUrl = `tel:${phoneNumber}`;
    const context = {
      accountSid: twilioCredentials.accountSid,
      phoneNumber,
      label
    };

    // Never the request itself: it carries the Twilio secret.
    logger.verbose("call to linkTwilio", {
      phoneNumber,
      credentialKind:
        "authToken" in twilioCredentials && twilioCredentials.authToken
          ? "authToken"
          : "apiKey"
    });

    try {
      // Validates that the appRef exists in the caller's workspace (RV-B4)
      await checkNumberPreconditions({ appRef, accessKeyId });
    } catch (e) {
      // The contract reports an app outside the workspace as NOT_FOUND, with the usual message.
      if (e instanceof GrpcError && e.code === status.INVALID_ARGUMENT) {
        callback({ code: status.NOT_FOUND, message: e.message });
        return;
      }
      throw e;
    }
    await checkRefs?.(accessKeyId, numberRefs(request));

    if (aclEntries.length === 0) {
      callback({
        code: status.FAILED_PRECONDITION,
        message: "This install has no public SIP address to allow in Twilio"
      });
      return;
    }

    const sipCredential = {
      username: `fonoster-${randomBytes(4).toString("hex")}`,
      password: generatePassword()
    };

    let twilioTrunkSid: string;
    try {
      ({ twilioTrunkSid } = await twilio.provisionTwilioTrunk(
        twilioCredentials,
        {
          phoneNumber,
          label,
          originationUri: `sip:${inboundUri}`,
          aclEntries,
          sipCredential
        }
      ));
    } catch (e) {
      callback(twilioLinkErrorToGrpc(e, context));
      return;
    }

    const { ref: credentialsRef } = await credentials.createCredentials({
      name: `Twilio ${label}`,
      ...sipCredential,
      extended: { accessKeyId }
    });

    const trunk = await findOwned(
      (r) => trunks.listTrunks(r),
      accessKeyId,
      (t) => t.inboundUri === inboundUri
    );

    let trunkRef: string;
    if (trunk) {
      await trunks.updateTrunk(
        mergeTrunkUpdate(
          { ref: trunk.ref, outboundCredentialsRef: credentialsRef },
          trunk
        )
      );
      trunkRef = trunk.ref;
    } else {
      ({ ref: trunkRef } = await trunks.createTrunk({
        name: "Twilio Trunk",
        inboundUri,
        sendRegister: false,
        outboundCredentialsRef: credentialsRef,
        uris: [
          {
            host: `${label}.${TWILIO_PSTN_URI_BASE}`,
            port: 5060,
            transport: Transport.UDP,
            enabled: true,
            weight: 10,
            priority: 10
          }
        ],
        extended: { accessKeyId }
      } as CreateTrunkRequestExtended));
    }

    const number = await findOwned(
      (r) => numbers.listNumbers(r),
      accessKeyId,
      (n) => n.telUrl === telUrl
    );

    const appPeerAor =
      routing && appRef ? await routing.aorFor({ appRef, telUrl }) : undefined;

    let ref: string;
    if (number) {
      await numbers.updateNumber(
        convertToRoutrNumberUpdate(
          {
            ref: number.ref,
            name: request.name || number.name,
            trunkRef,
            appRef,
            agentAor
          },
          appPeerAor
        )
      );
      ref = number.ref;
    } else {
      const { countryIso2, countryIso3 } = phone(phoneNumber);
      ({ ref } = await numbers.createNumber(
        convertToRoutrNumber(
          {
            name: request.name || phoneNumber,
            telUrl,
            city: "unknown",
            country: countryIso3,
            countryIsoCode: countryIso2,
            trunkRef,
            appRef,
            agentAor
          },
          accessKeyId,
          appPeerAor
        )
      ));
    }

    // The last write to Twilio: until it succeeds, the number keeps its previous routing.
    try {
      await twilio.assignTwilioNumberToTrunk(twilioCredentials, {
        phoneNumber,
        twilioTrunkSid
      });
    } catch (e) {
      callback(twilioLinkErrorToGrpc(e, context));
      return;
    }

    try {
      await twilio.removeOtherTwilioSipCredentials(twilioCredentials, {
        label,
        keepUsername: sipCredential.username
      });
      if (trunk?.outboundCredentialsRef) {
        await credentials.deleteCredentials(trunk.outboundCredentialsRef);
      }
    } catch {
      logger.warn("could not remove the previous SIP credentials", {
        phoneNumber
      });
    }

    callback(null, { ref, trunkRef });
  };

  return withErrorHandlingAndValidation(fn, V.linkTwilioRequestSchema);
}

export { linkTwilio, LinkTwilioDeps };

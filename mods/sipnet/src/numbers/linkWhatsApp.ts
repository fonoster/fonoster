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
import net from "node:net";
import {
  getAccessKeyIdFromCall,
  GrpcError,
  GrpcErrorMessage,
  NumberPreconditionsCheck,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import {
  CreateTrunkRequestExtended,
  CredentialsApi,
  LinkWhatsAppRequest,
  LinkWhatsAppResponse,
  NumbersApi,
  Transport,
  TrunkApi,
  UpdateCredentialsRequest
} from "@fonoster/types";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";
import { CommonConnect as CC } from "@routr/common";
import { phone } from "phone";
import { CheckRefs, numberRefs } from "../resources/checkRefs";
import { mergeTrunkUpdate } from "../trunks/operations";
import {
  convertToRoutrNumber,
  convertToRoutrNumberUpdate
} from "./convertToRoutrNumber";
import { NumberRouting } from "./engineRouting";
import { findAny, findOwned, generatePassword } from "./linkShared";

const logger = getLogger({ service: "sipnet", filePath: __filename });

/** Meta's SIP edge for WhatsApp Business Calling. */
const META_SIP_HOST = "wa.meta.vc";
const META_SIP_PORT = 5061;

/** A public SIP endpoint of the install, as `regions.public[].endpoints.sip` declares it. */
type SipEndpoint = { host: string; port: number; transport: string };

/**
 * Trunk fields Routr has and the Fonoster Trunk proto doesn't: they reach Routr through the SDK's
 * pass-through (routr connect proto, `@routr/common` 2.24.0). Meta answers 403 unless From carries
 * the registered hostname, so every WhatsApp trunk sets them.
 */
type RoutrTrunkFields = Pick<
  CC.Trunk,
  "normalizeToE164" | "rewriteFromWithNumber" | "fromDomain"
>;

type LinkWhatsAppDeps = {
  numbers: NumbersApi;
  trunks: TrunkApi;
  credentials: CredentialsApi;
  checkNumberPreconditions: NumberPreconditionsCheck;
  routing?: NumberRouting;
  checkRefs?: CheckRefs;
  /** Where carriers reach this install's trunks (`pstn.<domain>`). */
  pstnRoot: string;
  /** The install's public SIP endpoints; the TLS one is what the org registers in Meta. */
  sipEndpoints: SipEndpoint[];
};

const isTlsHostname = (endpoint: SipEndpoint) =>
  endpoint.transport?.toLowerCase() === "tls" && net.isIP(endpoint.host) === 0;

/**
 * Links a WhatsApp Business number: one credential, one TLS trunk to Meta and the Number, all per
 * number, since Meta issues one SIP password per number and a Routr trunk holds one outbound
 * credential. Fonoster calls no Meta API: the response carries the hostname the org registers in
 * WhatsApp Manager, and the Meta-issued password arrives as `sipPassword`, now or on a later call.
 */
function linkWhatsApp(deps: LinkWhatsAppDeps) {
  const {
    numbers,
    trunks,
    credentials,
    checkNumberPreconditions,
    routing,
    checkRefs,
    pstnRoot,
    sipEndpoints
  } = deps;

  const fn = async (
    call: { request: LinkWhatsAppRequest },
    callback: (
      error?: GrpcErrorMessage,
      response?: LinkWhatsAppResponse
    ) => void
  ) => {
    const { request } = call;
    const { phoneNumber, appRef, agentAor, sipPassword } = request;

    const accessKeyId = getAccessKeyIdFromCall(
      call as unknown as ServerInterceptingCall
    );
    const label = accessKeyId.toLowerCase();
    const digits = phoneNumber.replace(/^\+/, "");
    const inboundUri = `wa-${label}-${digits}.${pstnRoot}`;
    const telUrl = `tel:${phoneNumber}`;

    // Never the request itself: it may carry the SIP password.
    logger.verbose("call to linkWhatsApp", { phoneNumber, label });

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

    const tlsEndpoint = sipEndpoints.find(isTlsHostname);
    if (!tlsEndpoint) {
      callback({
        code: status.FAILED_PRECONDITION,
        message:
          "This install has no public SIP over TLS address for WhatsApp to send calls to"
      });
      return;
    }

    // Routr lists every workspace's items: a host or number another workspace owns stops the link
    // before any write (Routr's inbound_uri and tel_url are unique).
    const foreignTrunk = await findAny(
      (r) => trunks.listTrunks(r),
      (t) => t.inboundUri === inboundUri
    );
    if (foreignTrunk && foreignTrunk.extended?.accessKeyId !== accessKeyId) {
      callback({
        code: status.FAILED_PRECONDITION,
        message: `${inboundUri} is already in use`
      });
      return;
    }
    const foreignNumber = await findAny(
      (r) => numbers.listNumbers(r),
      (n) => n.telUrl === telUrl
    );
    if (foreignNumber && foreignNumber.extended?.accessKeyId !== accessKeyId) {
      callback({
        code: status.FAILED_PRECONDITION,
        message: `${phoneNumber} is already linked in another workspace`
      });
      return;
    }

    const trunk = foreignTrunk;
    const credentialName = `WhatsApp ${phoneNumber}`;

    // The credential: the trunk's, updated in place, or a new one
    let credentialsRef: string;
    let sipPasswordSet: boolean;
    if (trunk?.outboundCredentialsRef) {
      credentialsRef = trunk.outboundCredentialsRef;
      const current = await credentials.getCredentials(credentialsRef);
      const update: Partial<UpdateCredentialsRequest> & {
        ref: string;
        username: string;
        password?: string;
        extended?: Record<string, unknown>;
      } = {
        ref: credentialsRef,
        name: credentialName,
        username: digits,
        extended: {
          ...(current.extended ?? {}),
          accessKeyId,
          ...(sipPassword ? { sipPasswordSet: true } : {})
        }
      };
      if (sipPassword) update.password = sipPassword;
      await credentials.updateCredentials(update as UpdateCredentialsRequest);
      sipPasswordSet =
        Boolean(sipPassword) || current.extended?.sipPasswordSet === true;
    } else {
      ({ ref: credentialsRef } = await credentials.createCredentials({
        name: credentialName,
        username: digits,
        password: sipPassword ?? generatePassword(),
        extended: {
          accessKeyId,
          ...(sipPassword ? { sipPasswordSet: true } : {})
        }
      }));
      sipPasswordSet = Boolean(sipPassword);
    }

    const routrTrunkFields: RoutrTrunkFields = {
      normalizeToE164: true,
      rewriteFromWithNumber: true,
      fromDomain: inboundUri
    };

    let trunkRef: string;
    if (trunk) {
      await trunks.updateTrunk({
        ...mergeTrunkUpdate(
          { ref: trunk.ref, outboundCredentialsRef: credentialsRef },
          trunk
        ),
        inboundCredentialsRef: credentialsRef,
        ...routrTrunkFields
      });
      trunkRef = trunk.ref;
    } else {
      ({ ref: trunkRef } = await trunks.createTrunk({
        name: `WhatsApp Trunk ${phoneNumber}`,
        inboundUri,
        sendRegister: false,
        inboundCredentialsRef: credentialsRef,
        outboundCredentialsRef: credentialsRef,
        uris: [
          {
            host: META_SIP_HOST,
            port: META_SIP_PORT,
            transport: Transport.TLS,
            user: digits,
            enabled: true,
            weight: 10,
            priority: 10
          }
        ],
        ...routrTrunkFields,
        extended: { accessKeyId }
      } as CreateTrunkRequestExtended & RoutrTrunkFields));
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

    logger.verbose("linked the WhatsApp number", {
      phoneNumber,
      label,
      sipPasswordSet
    });

    callback(null, {
      ref,
      trunkRef,
      sipServerHostname: inboundUri,
      sipServerPort: tlsEndpoint.port,
      sipPasswordSet
    });
  };

  return withErrorHandlingAndValidation(fn, V.linkWhatsAppRequestSchema);
}

export { linkWhatsApp, LinkWhatsAppDeps, SipEndpoint };

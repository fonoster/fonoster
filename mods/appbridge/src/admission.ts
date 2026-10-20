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
import { createServiceDefinition } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";

/** The session a call would start (add-billing-service D7). */
export type AdmissionRequest = {
  callRef: string;
  appRef: string;
  /** The app's workspace (its access key id); empty for apps without one. */
  workspaceRef: string;
  direction: "inbound" | "outbound";
  origin: "call" | "browser_test";
  from: string;
  to: string;
};

/** Whether a call may start; a refusal names its reason. */
export type AdmissionDecision = { authorized: boolean; reason?: string };

/** Asks whether a call may start (the authorization service's CheckSessionAuthorized). */
export type Admission = ((
  request: AdmissionRequest
) => Promise<AdmissionDecision>) & {
  /** Releases the connection, if the admission holds one. */
  close?: () => void;
};

/** An answer slower than this admits the call: billing being down never takes calls down. */
export const ADMISSION_TIMEOUT_MS = 500;

/** The SIP status a refusal is rejected with (voice-session, "Calls are admitted before they start"). */
export const refusalStatus = (reason?: string) =>
  reason === "concurrency_limit" ? 503 : 402;

/**
 * Asks for admission; a timeout or an error admits and is reported as such, so the caller can log
 * it.
 */
export async function admit(
  admission: Admission,
  request: AdmissionRequest,
  timeoutMs = ADMISSION_TIMEOUT_MS
): Promise<AdmissionDecision & { failed?: string }> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<AdmissionDecision & { failed: string }>(
    (resolve) => {
      timer = setTimeout(
        () =>
          resolve({ authorized: true, failed: `no answer in ${timeoutMs} ms` }),
        timeoutMs
      );
    }
  );
  try {
    return await Promise.race([
      admission(request).catch((e: Error) => ({
        authorized: true,
        failed: e.message
      })),
      timeout
    ]);
  } finally {
    clearTimeout(timer);
  }
}

type AuthzStub = grpc.Client & {
  checkSessionAuthorized(
    request: Record<string, unknown>,
    options: Partial<grpc.CallOptions>,
    callback: grpc.requestCallback<{ authorized: boolean; reason?: string }>
  ): void;
};

/** Admission from an authorization service at `address` (host:port, plaintext gRPC). */
export function grpcAdmission(
  address: string,
  timeoutMs = ADMISSION_TIMEOUT_MS
): Admission {
  const definition = createServiceDefinition({
    serviceName: "Authz",
    pckg: "authz",
    proto: "authz.proto",
    version: "v1beta2"
  });
  const client = new (grpc.makeGenericClientConstructor(
    definition,
    "Authz",
    {}
  ))(address, grpc.credentials.createInsecure()) as unknown as AuthzStub;
  const admission: Admission = (request) =>
    new Promise((resolve, reject) =>
      client.checkSessionAuthorized(
        {
          accessKeyId: request.workspaceRef,
          appRef: request.appRef,
          callRef: request.callRef,
          callerNumber: request.from,
          ingressNumber: request.to,
          callDirection:
            request.origin === "browser_test"
              ? "INTRA_NETWORK"
              : request.direction === "inbound"
                ? "FROM_PSTN"
                : "TO_PSTN",
          metadata: { origin: request.origin }
        },
        { deadline: new Date(Date.now() + timeoutMs) },
        (error, response) =>
          error
            ? reject(error)
            : resolve({
                authorized: Boolean(response?.authorized),
                ...(response?.reason ? { reason: response.reason } : {})
              })
      )
    );
  admission.close = () => client.close();
  return admission;
}

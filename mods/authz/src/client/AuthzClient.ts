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
import * as grpc from "@grpc/grpc-js";
import { serviceDefinition } from "../serviceDefinition";
import {
  AddBillingMeterEventRequest,
  CheckMethodAuthorizedRequest,
  SessionDecision,
  SessionRefusal,
  VoiceRequest
} from "../types";
import { AuthzServiceClient } from "./AuthzServiceClient";

/**
 * AuthzClient class to interact with the AuthzServer via gRPC.
 */
export class AuthzClient {
  private readonly client: AuthzServiceClient;

  /**
   * Initializes the AuthzClient with the given configuration.
   * @param address The address of the AuthzServer (e.g., "localhost:50051").
   */
  constructor(address: string) {
    this.client = new (grpc.makeGenericClientConstructor(
      serviceDefinition,
      "AuthzService",
      {}
    ))(
      address,
      grpc.credentials.createInsecure()
    ) as unknown as AuthzServiceClient;
  }

  /**
   * Checks if the session is authorized.
   * @param request VoiceRequest containing session details.
   * @returns Promise resolving to a boolean indicating authorization.
   */
  async checkSessionAuthorized(
    request: Partial<VoiceRequest>
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.client.checkSessionAuthorized(request, (error, response) => {
        if (error) {
          reject(
            new Error(
              `checkSessionAuthorized failed: ${error.message || error}`
            )
          );
        } else if (response && typeof response.authorized === "boolean") {
          resolve(response.authorized);
        } else {
          reject(
            new Error(`checkSessionAuthorized failed: Invalid response format.`)
          );
        }
      });
    });
  }

  /**
   * Asks whether a session may start; a refusal names its reason (add-billing-service D7).
   * @param request VoiceRequest containing session details.
   * @param deadlineMs How long to wait for the answer before failing.
   */
  async checkSession(
    request: Partial<VoiceRequest>,
    deadlineMs?: number
  ): Promise<SessionDecision> {
    const options = deadlineMs
      ? { deadline: new Date(Date.now() + deadlineMs) }
      : {};
    return new Promise<SessionDecision>((resolve, reject) => {
      this.client.checkSessionAuthorized(
        request,
        options,
        (error, response) => {
          if (error) {
            reject(new Error(`checkSession failed: ${error.message || error}`));
          } else if (response && typeof response.authorized === "boolean") {
            resolve(
              response.authorized
                ? { authorized: true }
                : {
                    authorized: false,
                    ...(response.reason
                      ? { reason: response.reason as SessionRefusal }
                      : {})
                  }
            );
          } else {
            reject(new Error("checkSession failed: Invalid response format."));
          }
        }
      );
    });
  }

  /**
   * Checks if a specific method is authorized.
   * @param request CheckMethodAuthorizedRequest containing accessKeyId and method.
   * @returns Promise resolving to a boolean indicating authorization.
   */
  async checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.client.checkMethodAuthorized(request, (error, response) => {
        if (error) {
          reject(
            new Error(`checkMethodAuthorized failed: ${error.message || error}`)
          );
        } else if (response && typeof response.authorized === "boolean") {
          resolve(response.authorized);
        } else {
          reject(
            new Error(`checkMethodAuthorized failed: Invalid response format.`)
          );
        }
      });
    });
  }

  /**
   * Adds a billing meter event.
   * @param request AddBillingMeterEventRequest containing accessKeyId and amount.
   * @returns Promise resolving when the charge is successful.
   */
  async addBillingMeterEvent(
    request: AddBillingMeterEventRequest
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.addBillingMeterEvent(request, (error, _response) => {
        if (error) {
          reject(
            new Error(`addBillingMeterEvent failed: ${error.message || error}`)
          );
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Closes the gRPC client connection.
   */
  close(): void {
    this.client.close();
  }
}

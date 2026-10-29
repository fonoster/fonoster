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
import { GraphResponseError } from "./createGraphClient";
import { WhatsAppLinkError } from "./WhatsAppLinkError";

// Graph error codes. PROVISIONAL until the baseline recording
// (test/whatsapp/fixtures/baseline-2026-10.md, #1191) lands: each constant is then set to the code
// the recording shows, and a reason the recording never produced is dropped.
/** OAuthException: the token is invalid, expired or revoked. */
const GRAPH_INVALID_TOKEN_CODE = 190;
/** The token lacks a permission for the call. */
const GRAPH_PERMISSION_CODES = [10, 200];
/** Invalid parameter; with subcode 33 Graph means "object missing or no permission to see it". */
const GRAPH_INVALID_PARAMETER_CODE = 100;
const GRAPH_OBJECT_UNREACHABLE_SUBCODE = 33;

type GraphStep =
  | "phoneNumbers.get"
  | "settings.get"
  | "settings.post"
  | "settings.getCredentials";

/**
 * Runs one Graph API call and turns its failure into a WhatsAppLinkError naming the step. A raw
 * fetch error carries the request and its Authorization header, so it never leaves this function.
 */
async function runStep<T>(step: GraphStep, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error: unknown) {
    if (!(error instanceof GraphResponseError)) {
      throw new WhatsAppLinkError(
        "UNAVAILABLE",
        "Meta could not be reached",
        step
      );
    }

    const { status } = error;
    const { code, error_subcode: subcode, message } = error.body.error ?? {};
    const text = `Meta answered ${status}${code !== undefined ? ` (code ${code}${subcode !== undefined ? `/${subcode}` : ""})` : ""}: ${message ?? ""}`;

    if (status >= 500) {
      throw new WhatsAppLinkError("UNAVAILABLE", text, step);
    }

    if (code === GRAPH_INVALID_TOKEN_CODE) {
      throw new WhatsAppLinkError("TOKEN_REFUSED", text, step);
    }

    if (code !== undefined && GRAPH_PERMISSION_CODES.includes(code)) {
      throw new WhatsAppLinkError("PERMISSION_MISSING", text, step);
    }

    if (
      code === GRAPH_INVALID_PARAMETER_CODE &&
      subcode === GRAPH_OBJECT_UNREACHABLE_SUBCODE
    ) {
      throw new WhatsAppLinkError("NUMBER_NOT_FOUND", text, step);
    }

    if (step === "settings.post" && code === GRAPH_INVALID_PARAMETER_CODE) {
      throw new WhatsAppLinkError("SIP_SERVER_REJECTED", text, step);
    }

    throw new Error(`Meta step ${step} failed. ${text}`);
  }
}

export { GraphStep, runStep };

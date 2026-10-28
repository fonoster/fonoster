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
import { TwilioLinkError } from "./TwilioLinkError";

// Codes from the baseline recording (test/twilio/fixtures/baseline-2026-10.md): Twilio refuses a
// missing key permission with 401 and code 70051, and a trunk domain another account owns with a
// bare 400 (code 400) on trunks.create
const TWILIO_AUTHENTICATION_FAILED_CODE = 20003;
const TWILIO_PERMISSION_MISSING_CODE = 70051;
const TWILIO_DOMAIN_TAKEN_CODE = 400;

type TwilioRestError = { status: number; code?: number; message?: string };

function isRestError(error: unknown): error is TwilioRestError {
  return (
    typeof error === "object" &&
    error !== null &&
    typeof (error as TwilioRestError).status === "number"
  );
}

/**
 * Runs one Twilio call and turns its failure into a TwilioLinkError naming the step. A raw
 * twilio-node or Axios error carries the request and its Authorization header, so it never
 * leaves this function.
 */
async function runStep<T>(step: string, call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error: unknown) {
    if (!isRestError(error)) {
      throw new TwilioLinkError(
        "UNAVAILABLE",
        "Twilio could not be reached",
        step
      );
    }

    const { status, code, message } = error;
    const text = `Twilio answered ${status}${code ? ` (code ${code})` : ""}: ${message ?? ""}`;

    if (status === 403 || code === TWILIO_PERMISSION_MISSING_CODE) {
      throw new TwilioLinkError("PERMISSION_MISSING", text, step);
    }

    if (status === 401 || code === TWILIO_AUTHENTICATION_FAILED_CODE) {
      throw new TwilioLinkError("CREDENTIALS_REFUSED", text, step);
    }

    if (
      step === "trunking.trunks.create" &&
      code === TWILIO_DOMAIN_TAKEN_CODE
    ) {
      throw new TwilioLinkError("DOMAIN_TAKEN", text, step);
    }

    if (status >= 500) {
      throw new TwilioLinkError("UNAVAILABLE", text, step);
    }

    throw new Error(`Twilio step ${step} failed. ${text}`);
  }
}

export { runStep, TWILIO_DOMAIN_TAKEN_CODE };

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
/** A Stripe API error, answered in Stripe's shape `{error: {type, code, message, param, ...}}`. */
export class StripeError extends Error {
  constructor(
    readonly status: number,
    readonly type:
      | "invalid_request_error"
      | "card_error"
      | "idempotency_error"
      | "rate_limit_error"
      | "api_error",
    message: string,
    readonly extra: {
      code?: string;
      param?: string;
      decline_code?: string;
      payment_intent?: unknown;
    } = {}
  ) {
    super(message);
  }

  toJSON() {
    return { error: { type: this.type, message: this.message, ...this.extra } };
  }
}

export const missing = (param: string) =>
  new StripeError(
    400,
    "invalid_request_error",
    `Missing required param: ${param}.`,
    {
      code: "parameter_missing",
      param
    }
  );

export const notFound = (kind: string, id: string, param = "id") =>
  new StripeError(404, "invalid_request_error", `No such ${kind}: '${id}'`, {
    code: "resource_missing",
    param
  });

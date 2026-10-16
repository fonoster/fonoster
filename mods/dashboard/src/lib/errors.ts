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
/** gRPC status codes the screens react to. */
export const GrpcCode = {
  INVALID_ARGUMENT: 3,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  UNAVAILABLE: 14,
  UNAUTHENTICATED: 16
} as const;

export function grpcCode(error: unknown): number | undefined {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "number" ? code : undefined;
}

export function errorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again."
): string {
  switch (grpcCode(error)) {
    case GrpcCode.RESOURCE_EXHAUSTED:
      return "Too many attempts. Try again in a few minutes.";
    case GrpcCode.UNAVAILABLE:
      return "Can't reach the Fonoster API. Check your connection and try again.";
  }
  const message = (error as { message?: unknown })?.message;
  return typeof message === "string" && message.length > 0 ? message : fallback;
}

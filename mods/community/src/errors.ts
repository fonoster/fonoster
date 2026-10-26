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
/** What a provider serves to a call: a language model, speech recognition or speech synthesis. */
export type ProviderKind = "llm" | "stt" | "tts";

/**
 * A vendor rejected the key (HTTP 401 or 403, on a request or a WebSocket handshake). Retrying
 * can't help, so it is fatal to the call: the session hangs up and the call record fails with
 * reason provider_auth_failed, naming the provider. On the wire it stays provider_unavailable.
 */
export class ProviderAuthError extends Error {
  readonly code = "provider_unavailable";
  readonly reason = "provider_auth_failed";

  constructor(
    /**
     * The catalog provider the customer configured (e.g. together), or the adapter id (deepgram,
     * elevenlabs, openai, groq, fake) when the adapter was built without one.
     */
    readonly provider: string,
    readonly kind: ProviderKind,
    readonly status: number
  ) {
    super(`${provider} rejected the credentials (HTTP ${status})`);
    this.name = "ProviderAuthError";
  }
}

/** True for the HTTP statuses a vendor answers a key it does not accept with. */
export function isAuthStatus(status: number): boolean {
  return status === 401 || status === 403;
}

/**
 * True for a ProviderAuthError, told by its discriminant rather than `instanceof`: the class can
 * be loaded twice (one copy per package that bundles @fonoster/community), and an error from one
 * copy is not an instance of the other.
 */
export function isProviderAuthError(e: unknown): e is ProviderAuthError {
  const x = e as Partial<ProviderAuthError> | null | undefined;
  return (
    x?.reason === "provider_auth_failed" &&
    typeof x.provider === "string" &&
    typeof x.kind === "string"
  );
}

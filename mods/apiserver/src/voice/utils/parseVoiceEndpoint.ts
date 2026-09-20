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
/**
 * Splits an application endpoint into the address to dial and whether the
 * connection should use TLS.
 *
 * An endpoint is a bare `host:port` by default, dialed insecurely, which is
 * how every existing application is configured. Prefixing it with a scheme
 * opts into TLS without needing a new field on the application:
 *
 * - `grpcs://host:443` / `https://host:443` -> TLS
 * - `grpc://host:50051` / `http://host:50051` -> plaintext
 * - `host:50051` -> plaintext (unchanged)
 *
 * TLS is what an application behind a terminating reverse proxy or ingress
 * needs: the proxy expects a ClientHello and drops a plaintext HTTP/2
 * preface before any routing happens.
 */
function parseVoiceEndpoint(endpoint: string): {
  address: string;
  secure: boolean;
} {
  const match = /^([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(.*)$/.exec(endpoint ?? "");

  if (!match) {
    return { address: endpoint, secure: false };
  }

  const [, scheme, address] = match;
  const normalizedScheme = scheme.toLowerCase();

  if (normalizedScheme === "grpcs" || normalizedScheme === "https") {
    return { address, secure: true };
  }

  if (normalizedScheme === "grpc" || normalizedScheme === "http") {
    return { address, secure: false };
  }

  throw new Error(
    `unsupported scheme "${scheme}" in endpoint "${endpoint}"; ` +
      "use grpcs:// or https:// for TLS, grpc:// or http:// for plaintext, " +
      "or a bare host:port"
  );
}

export { parseVoiceEndpoint };

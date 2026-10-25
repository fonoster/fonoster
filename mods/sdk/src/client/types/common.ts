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
type MappingTuple<T> = Array<[string, T]>;

/**
 * A unary RPC as both transports declare it: grpc-js on Node and grpc-web in browsers. Each takes
 * its own metadata type (grpc-js's Metadata class, grpc-web's string map), and callers always pass
 * the same client's getMetadata(), so metadata stays opaque here. Declared with method syntax so
 * either transport's narrower metadata parameter is accepted. On success err is null and response
 * is set; on failure callers return before reading response.
 */
type ClientFunction<T, U> = {
  rpc(
    request: T,
    metadata: unknown,
    callback: (err: Error | null, response: U) => void
  ): unknown;
}["rpc"];

type DataResponse = { toObject: () => unknown };

/** A server stream, typed per event as grpc-js streams and grpc-web's ClientReadableStream emit. */
type ServerStream<U> = {
  on(event: "data", listener: (response: U) => void): unknown;
  on(event: "error", listener: (err: Error) => void): unknown;
  on(event: "end", listener: () => void): unknown;
  on(event: "status", listener: (status: unknown) => void): unknown;
};

/** Opens a server stream; metadata is opaque for the same reason as in ClientFunction. */
type ServerStreamFunction<T, U> = {
  rpc(request: T, metadata: unknown): ServerStream<U>;
}["rpc"];

export { ClientFunction, DataResponse, MappingTuple, ServerStreamFunction };

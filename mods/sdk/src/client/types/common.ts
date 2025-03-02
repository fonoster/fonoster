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
import { Metadata } from "grpc-web";

type MappingTuple<T> = Array<[string, T]>;

type ClientFunction<T, U> = (
  request: T,
  metadata: Metadata | unknown | null,
  callback: (err: Error | null, response: U | null) => void
) => void;

type DataResponse = { toObject: () => unknown };

type ServerStream<U> = {
  on: (
    event: "data" | "error" | "end" | "status",
    listener: (response: U | Error | DataResponse) => void
  ) => void;
};

type ServerStreamFunction<T, U> = (
  request: T,
  metadata: Metadata | unknown | null
) => ServerStream<U>;

export { ClientFunction, DataResponse, MappingTuple, ServerStreamFunction };

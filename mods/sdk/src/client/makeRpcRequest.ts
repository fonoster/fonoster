/* eslint-disable no-loops/no-loops */
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { jsonToObject } from "./jsonToObject";
import { objectToJson } from "./objectToJson";
import { ClientFunction } from "./types";

function makeRpcRequest<
  RequestPB,
  ResponsePB,
  Request extends Record<string, unknown>,
  Response extends Record<string, unknown>
>(
  method: ClientFunction<RequestPB, ResponsePB>,
  RequestPBObjectConstructor: new () => RequestPB,
  metadata: unknown,
  request: Request
): Promise<Response> {
  const reqPB = jsonToObject<Request, RequestPB>(
    request,
    RequestPBObjectConstructor
  );

  return new Promise((resolve, reject) => {
    // TODO: Update error to use GrpcError
    method(reqPB, metadata, (err: Error | null, responsePB: ResponsePB) => {
      if (err) {
        reject(err);
        return;
      }

      const json = objectToJson<Response>(
        responsePB as unknown as new () => unknown
      );

      resolve(json);
    });
  });
}

export { makeRpcRequest };

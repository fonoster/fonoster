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
import { status } from "@grpc/grpc-js";

const testCases = [
  {
    api: "Applications",
    cases: [
      {
        id: "fnstr000",
        name: "should create an application",
        method: "createApplication",
        request: {
          name: "My Application",
          type: "PROGRAMMABLE_VOICE",
          appEndpoint: "localhost:3000"
        },
        grpcCode: status.OK
      },
      {
        id: "fnstr001",
        name: "should failed to create an application (missing name)",
        method: "createApplication",
        request: {
          type: "PROGRAMMABLE_VOICE",
          appEndpoint: "localhost:3000"
        },
        grpcCode: status.INVALID_ARGUMENT
      },
      {
        id: "fnstr002",
        name: "should failed to find the application",
        method: "getApplication",
        request: {
          ref: "{{ref}}"
        },
        grpcCode: status.OK,
        needsResultFrom: "fnstr000"
      }
    ]
  }
];

export { testCases };

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
import SDK from "@routr/sdk";
import {
  createACL,
  deleteACL,
  getACL,
  listACLs,
  updateACL
} from "./operations";
import { ClientOptions } from "../types";

function buildService(clientOptions: ClientOptions) {
  const client = new SDK.ACL(clientOptions);

  return {
    definition: {
      serviceName: "ACL",
      pckg: "acl",
      version: "v1beta2",
      proto: "acl.proto"
    },
    handlers: {
      createAcl: createACL(client),
      updateAcl: updateACL(client),
      getAcl: getACL(client),
      listAcl: listACLs(client),
      deleteAcl: deleteACL(client)
    }
  };
}

export { buildService };

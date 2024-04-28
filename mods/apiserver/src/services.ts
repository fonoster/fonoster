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
import { prisma } from "./db";
import { exchangeCredentials } from "./identity/exchangeCredentials";
import { createGroup, deleteGroup } from "./identity/groups";
import { refreshToken } from "./identity/refreshToken";
import {
  createUser,
  deleteUser,
  getUserById,
  updateUser
} from "./identity/users";

const services = [
  {
    definition: {
      serviceName: "Identity",
      pckg: "identity",
      version: "v1beta2",
      proto: "identity.proto"
    },
    handlers: {
      createUser: createUser(prisma),
      getUserById: getUserById(prisma),
      deleteUser: deleteUser(prisma),
      updateUser: updateUser(prisma),
      createGroup: createGroup(prisma),
      deleteGroup: deleteGroup(prisma),
      exchangeCredentials,
      refreshToken
    }
  }
];

export default services;

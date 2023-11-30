/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import * as grpc from "@grpc/grpc-js";
import UserPB, {
  CreateUserRequest,
  UpdateUserRequest,
  GetUserRequest,
  DeleteUserRequest,
  CreateUserCredentialsRequest,
  CreateUserCredentialsResponse,
  ListUsersRequest,
  ListUsersResponse,
  User
} from "./protos/users_pb";
import {
  IUsersService,
  UsersService,
  IUsersServer
} from "./protos/users_grpc_pb";
import {
  getRedisConnection,
  getAccessKeyId,
  getAccessKeySecret
} from "@fonoster/core";
import { Empty } from "./protos/common_pb";
import { assertNotEmpty, assertValidEmail, assertValidURL } from "./assertions";
import { FonosterError } from "@fonoster/errors";
import { ErrorCodes } from "@fonoster/errors";
import { UserLimiter, UserStatus } from "./types";
import { APISERVER_JWT_AUTH_ISS, APISERVER_JWT_PRIVATE_KEY } from "../envs";
import Auth from "@fonoster/auth/dist/utils/auth_utils";
import JWT from "@fonoster/auth/dist/utils/jwt";
import logger from "@fonoster/logger";
import bcrypt from "bcrypt";
import objectid from "bson-objectid";
import encoder from "./encoder";
import decoder from "./decoder";

const authenticator = new Auth(new JWT());

// TODO: Move to commons or core
async function getTokenRole(token: string): Promise<string> {
  try {
    const jwt = new JWT();
    const payload = (await jwt.decode(token, APISERVER_JWT_PRIVATE_KEY)) as {
      role: string;
    };
    return payload.role;
  } catch (e) {
    return null;
  }
}

class UsersServer implements IUsersServer {
  [name: string]: grpc.UntypedHandleCall;

  async listUsers(
    call: grpc.ServerUnaryCall<ListUsersRequest, ListUsersResponse>,
    callback: grpc.sendUnaryData<ListUsersResponse>
  ) {
    try {
      const redis = getRedisConnection();
      const role = await getTokenRole(getAccessKeySecret(call));
      const accessKeyId = getAccessKeyId(call);
      const list = await redis.smembers("fn_users");
      const emailFilter = call.request.getFiltersMap().get("email");
      const users: User[] = await Promise.all(
        list.map(async (ref) => {
          const raw = (await redis.get(ref)).toString();
          const asObj = decoder(raw);
          if (emailFilter && emailFilter !== asObj.getEmail()) {
            return;
          }

          if (
            accessKeyId === asObj.getAccessKeyId() ||
            role === "SERVICE" ||
            role === "ADMIN"
          ) {
            return asObj;
          }
        })
      );

      const response = new ListUsersResponse();
      response.setUsersList(users[0] ? users : []);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }

  async createUser(
    call: grpc.ServerUnaryCall<CreateUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      assertNotEmpty("name", call.request.getName());
      assertNotEmpty("secret", call.request.getSecret());
      assertValidEmail(call.request.getEmail());
      assertValidURL(call.request.getAvatar());

      const redis = getRedisConnection();

      const emailExist = await redis.get(call.request.getEmail());

      if (emailExist) {
        throw new FonosterError(
          "user already exist",
          ErrorCodes.ALREADY_EXISTS
        );
      }

      const ref = "US" + objectid();
      const user = new UserPB.User();

      user.setRef(ref);
      user.setAccessKeyId(ref);
      user.setName(call.request.getName());
      user.setEmail(call.request.getEmail());
      user.setAvatar(call.request.getAvatar());
      user.setUpdateTime(new Date().toISOString());
      user.setCreateTime(new Date().toISOString());
      user.setStatus(UserStatus.ACTIVE);
      user.setLimiter(UserLimiter.DEFAULT);
      // TODO: Apply strong cypher
      const secretHash = await bcrypt.hash(call.request.getSecret(), 10);

      redis.set(ref, encoder(user, secretHash));
      redis.set(call.request.getEmail(), ref);
      redis.sadd("fn_users", ref);
      callback(null, user);
    } catch (e) {
      callback(e, null);
    }
  }

  async updateUser(
    call: grpc.ServerUnaryCall<UpdateUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      const redis = getRedisConnection();
      const role = await getTokenRole(getAccessKeySecret(call));
      const ref = call.request.getRef();

      const raw = await redis.get(ref);
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);
      let secretHash = JSON.parse(raw.toString()).secretHash;
      const user = decoder(raw);

      if (call.request.getName()) user.setName(call.request.getName());
      if (call.request.getSecret()) {
        secretHash = await bcrypt.hash(call.request.getSecret(), 10);
      }
      if (call.request.getAvatar()) {
        assertValidURL(call.request.getAvatar());
        user.setAvatar(call.request.getAvatar());
      }

      if (call.request.getStatus()) {
        if (role === "SERVICE" || role === "ADMIN") {
          user.setStatus(call.request.getStatus());
        } else {
          throw new FonosterError(
            "not authorized",
            ErrorCodes.PERMISSION_DENIED
          );
        }
      }

      if (call.request.getLimiter()) {
        if (role === "SERVICE" || role === "ADMIN") {
          user.setLimiter(call.request.getLimiter());
        } else {
          throw new FonosterError(
            "not authorized",
            ErrorCodes.PERMISSION_DENIED
          );
        }
      }

      user.setUpdateTime(new Date().toISOString());
      redis.set(ref, encoder(user, secretHash));
      callback(null, user);
    } catch (e) {
      callback(e, null);
    }
  }

  async getUser(
    call: grpc.ServerUnaryCall<GetUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      const accessKeyId = getAccessKeyId(call);

      if (accessKeyId !== call.request.getRef()) {
        throw new FonosterError(
          "permission denied",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const redis = getRedisConnection();

      // Get result here
      const raw = await redis.get(call.request.getRef());

      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const user = decoder(raw.toString());
      callback(null, user);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteUser(
    call: grpc.ServerUnaryCall<DeleteUserRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      const redis = getRedisConnection();
      const raw = await redis.get(call.request.getRef());
      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);
      const user = decoder(raw.toString());
      await redis.del(user.getRef());
      await redis.del(user.getEmail());
      // TODO: Also unlink all of the User's projects
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }

  async createUserCredentials(
    call: grpc.ServerUnaryCall<
      CreateUserCredentialsRequest,
      CreateUserCredentialsResponse
    >,
    callback: grpc.sendUnaryData<CreateUserCredentialsResponse>
  ) {
    try {
      logger.verbose(
        `@fonoster/auth creating token [email is ${call.request.getEmail()}]`
      );
      const redis = getRedisConnection();

      const ref = await redis.get(call.request.getEmail());

      // Compare the value send with the value stored
      if (!ref) {
        throw new FonosterError(
          "invalid credentials",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const raw = await redis.get(ref);

      if (!raw) throw new FonosterError("not found", ErrorCodes.NOT_FOUND);

      const user = JSON.parse(raw.toString());

      if (!bcrypt.compareSync(call.request.getSecret(), user.secretHash)) {
        throw new FonosterError(
          "invalid credentials",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const result = await authenticator.createToken(
        user.accessKeyId,
        APISERVER_JWT_AUTH_ISS,
        "USER",
        APISERVER_JWT_PRIVATE_KEY,
        call.request.getExpiration() || "30d"
      );

      const response = new CreateUserCredentialsResponse();
      response.setAccessKeyId(user.accessKeyId);
      response.setAccessKeySecret(result.accessToken);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }
}

export { UsersServer as default, IUsersService, UsersService };

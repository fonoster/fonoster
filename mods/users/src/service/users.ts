/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import grpc from "@grpc/grpc-js";
import {
  CreateUserRequest,
  UpdateUserRequest,
  GetUserRequest,
  DeleteUserRequest,
  LoginRequest,
  LoginResponse
} from "./protos/users_pb";
import UserPB from "./protos/users_pb";
import {Empty} from "./protos/common_pb";
import {
  IUsersService,
  UsersService,
  IUsersServer
} from "./protos/users_grpc_pb";
import {assertNotEmpty, assertValidEmail, assertValidURL} from "./assertions";
import {getRedisConnection, getAccessKeyId} from "@fonos/core";
import objectid from "objectid";
import encoder from "./encoder";
import decoder from "./decoder";
import {FonosError} from "@fonos/errors";
import {ErrorCodes} from "@fonos/errors";
import Auth from "@fonos/auth/dist/utils/auth_utils";
import JWT from "@fonos/auth/src/utils/jwt";
import {AUTH_ISS, getSalt} from "@fonos/certs";
import logger from "@fonos/logger";
import bcrypt from "bcrypt";

const authenticator = new Auth(new JWT());
const redis = getRedisConnection();

class UsersServer implements IUsersServer {
  [name: string]: grpc.UntypedHandleCall;

  async createUser(
    call: grpc.ServerUnaryCall<CreateUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      assertNotEmpty("name", call.request.getName());
      assertNotEmpty("secret", call.request.getSecret());
      assertValidEmail(call.request.getEmail());
      assertValidURL(call.request.getAvatar());

      const emailExist = await redis.get(call.request.getEmail());

      if (emailExist) {
        throw new FonosError("user already exist", ErrorCodes.ALREADY_EXISTS);
      }

      const ref = objectid() + "";
      const user = new UserPB.User();

      user.setRef(ref);
      user.setAccessKeyId(ref);
      user.setName(call.request.getName());
      user.setEmail(call.request.getEmail());
      user.setAvatar(call.request.getAvatar());
      user.setUpdateTime(new Date().toISOString());
      user.setCreateTime(new Date().toISOString());
      // TODO: Apply strong cypher
      const secretHash = await bcrypt.hash(call.request.getSecret(), 10);

      redis.set(ref, encoder(user, secretHash));
      redis.set(call.request.getEmail(), ref);
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
      const ref = getAccessKeyId(call);
      const raw = (await redis.get(ref)).toString();
      let secretHash = JSON.parse(raw).secretHash;
      const user = decoder(raw);

      if (call.request.getName()) user.setName(call.request.getName());
      if (call.request.getSecret()) {
        secretHash = await bcrypt.hash(call.request.getSecret(), 10);
      }
      if (call.request.getAvatar()) {
        assertValidURL(call.request.getAvatar());
        user.setAvatar(call.request.getAvatar());
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
        throw new FonosError("permission denied", ErrorCodes.PERMISSION_DENIED);
      }

      // Get result here
      const raw = (await redis.get(call.request.getRef())).toString();
      const user = decoder(raw);
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
      const raw = (await redis.get(call.request.getRef())).toString();
      const user = decoder(raw);
      await redis.del(user.getRef());
      await redis.del(user.getEmail());
      // TODO: Also unlink all of the User's projects
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }

  async loginUser(
    call: grpc.ServerUnaryCall<LoginRequest, LoginResponse>,
    callback: grpc.sendUnaryData<LoginResponse>
  ) {
    try {
      logger.verbose(
        `@fonos/auth creating token [email is ${call.request.getEmail()}]`
      );
      const ref = await redis.get(call.request.getEmail());

      // Compare the value send with the value stored
      if (!ref) {
        throw new FonosError(
          "invalid credentials",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const raw = (await redis.get(ref)).toString();
      const user = JSON.parse(raw);

      if (!bcrypt.compareSync(call.request.getSecret(), user.secret)) {
        throw new FonosError(
          "invalid credentials",
          ErrorCodes.PERMISSION_DENIED
        );
      }

      const result = await authenticator.createToken(
        user.accessKeyId,
        AUTH_ISS,
        "USER",
        getSalt(),
        call.request.getExpiration() || "30d"
      );

      const response = new LoginResponse();
      response.setAccessKeyId(user.accessKeyId);
      response.setAccessKeySecret(result.accessToken);
      callback(null, response);
    } catch (e) {
      callback(e, null);
    }
  }
}

export {UsersServer as default, IUsersService, UsersService};

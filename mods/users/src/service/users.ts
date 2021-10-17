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
  DeleteUserRequest
} from "./protos/users_pb";
import UserPB from "./protos/users_pb";
import {Empty} from "./protos/common_pb";
import {
  IUsersService,
  UsersService,
  IUsersServer
} from "./protos/users_grpc_pb";

class UsersServer implements IUsersServer {
  [name: string]: grpc.UntypedHandleCall;
  async createUser(
    call: grpc.ServerUnaryCall<CreateUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      console.log("req: " + JSON.stringify(call.request));
      callback(null, null);
    } catch (e) {
      callback(e, null);
    }
  }

  async updateUser(
    call: grpc.ServerUnaryCall<UpdateUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    // Update user
    callback(null, null);
  }

  async getUser(
    call: grpc.ServerUnaryCall<GetUserRequest, UserPB.User>,
    callback: grpc.sendUnaryData<UserPB.User>
  ) {
    try {
      // Get result here
      callback(null, null);
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteUser(
    call: grpc.ServerUnaryCall<DeleteUserRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      // Delete here
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export {UsersServer as default, IUsersService, UsersService};

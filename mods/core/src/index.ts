/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import getAccessKeyId from "./common/get_access_key_id";
import getAccessKeySecret from "./common/get_access_key_secret";
import getRedisConnection from "./common/redis";
import { routr } from "./common/routr";
import ResourceServer from "./resources/resource_server";
import createResource from "./resources/create_resource";
import updateResource from "./resources/update_resource";
import { Kind, ResourceBuilder } from "./common/resource_builder";

export {
  ResourceServer,
  Kind,
  ResourceBuilder,
  routr,
  getRedisConnection,
  getAccessKeyId,
  getAccessKeySecret,
  createResource,
  updateResource
};

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
import { User } from "./protos/users_pb";

export default (raw: string): User => {
  const userJSON = JSON.parse(raw);
  const user = new User();
  user.setRef(userJSON.ref);
  user.setAccessKeyId(userJSON.accessKeyId);
  user.setEmail(userJSON.email);
  user.setName(userJSON.name);
  user.setAvatar(userJSON.avatar);
  user.setCreateTime(userJSON.createTime);
  user.setUpdateTime(userJSON.updateTime);
  user.setLimiter(userJSON.limiter);
  user.setStatus(userJSON.status);
  return user;
};

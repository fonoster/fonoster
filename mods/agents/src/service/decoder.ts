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
import { Agent } from "./protos/agents_pb";

export default function (jsonObj: any) {
  const agent = new Agent();
  const spec = jsonObj?.spec;
  agent.setRef(jsonObj.metadata.ref);
  agent.setName(jsonObj.metadata.name);
  agent.setUsername(spec?.credentials?.username);
  agent.setSecret(spec?.credentials?.secret);
  agent.setDomainsList(spec?.domains);
  agent.setCreateTime(jsonObj.metadata.createdOn);
  agent.setUpdateTime(jsonObj.metadata.modifiedOn);
  agent.setPrivacy(spec?.privacy);
  return agent;
}

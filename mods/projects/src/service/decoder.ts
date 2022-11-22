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
import { Project } from "./protos/projects_pb";

export default (raw: string): Project => {
  const projectJSON = JSON.parse(raw);
  const project = new Project();
  project.setRef(projectJSON.ref);
  project.setUserRef(projectJSON.userRef);
  project.setAccessKeyId(projectJSON.accessKeyId);
  project.setAccessKeySecret(projectJSON.accessKeySecret);
  project.setName(projectJSON.name);
  project.setAllowExperiments(projectJSON.allowExperiments);
  project.setCreateTime(projectJSON.createTime);
  project.setUpdateTime(projectJSON.updateTime);
  return project;
};

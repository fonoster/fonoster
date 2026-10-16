/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
// Must match ops/rebuild/cell/compose.yaml and the fonoster-rebuild Helm chart
// (docs/operators/regions.md): enroll once with the token, then start the region.
const CELL_COMPOSE = "ops/rebuild/cell/compose.yaml";
export const composeCommand = (token: string) =>
  `docker compose -f ${CELL_COMPOSE} run --rm --no-deps region-agent enroll ${token} && docker compose -f ${CELL_COMPOSE} up -d`;
export const helmCommand = (token: string) =>
  `helm install fonoster-region ops/rebuild/helm/fonoster-rebuild --set regionAgent.enabled=true --set regionAgent.enroll.token=${token}`;
export const secretCommand = (name: string) =>
  `fonoster-region secrets set ${name}`;

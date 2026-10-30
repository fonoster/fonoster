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
import { RegionHub } from "@fonoster/common";

// The NATS JWT helpers and generateRegionHub live in @fonoster/common (regions/hub) so the
// region hub setup (fonoster-region-hub-setup) can generate the region hub without the
// apiserver. Re-exported here so existing imports keep working.
export const {
  encodeNatsJwt,
  decodeNatsJwt,
  operatorJwt,
  accountJwt,
  userJwt,
  formatCreds,
  issueUserCreds,
  seedOf,
  keyPairFromSeed,
  REGIONS_ACCOUNT_NAME,
  regionsAccountJwt,
  generateRegionHub,
  createAccount,
  createOperator,
  createUser
} = RegionHub;

export type NatsClaims = RegionHub.NatsClaims;
export type UserPermissions = RegionHub.UserPermissions;
export type KeyPair = RegionHub.KeyPair;

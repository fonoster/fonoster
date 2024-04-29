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
import { GroupRoleEnum } from "./groups/GroupRoleEnum";
import TokenTypeEnum from "./TokenTypeEnum";

type Role = {
  name: string;
  description: string;
  access: string[];
};

type IDToken = {
  iss: string;
  sub: string;
  aud: string;
  username: string;
  givenName: string;
  familyName: string;
  email: string;
  exp: number;
  iat: number;
  accessKeyId: string;
  tokenType: TokenTypeEnum.ID;
};

type AccessToken = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  tokenType: TokenTypeEnum.ACCESS;
  accessKeyId: string;
  scope: GroupRoleEnum;
};

type RefreshToken = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  tokenType: TokenTypeEnum.REFRESH;
  accessKeyId: string;
  scope: GroupRoleEnum;
};

type DecodedToken<T extends TokenTypeEnum> = T extends TokenTypeEnum.ID
  ? IDToken
  : T extends TokenTypeEnum.ACCESS
    ? AccessToken
    : T extends TokenTypeEnum.REFRESH
      ? RefreshToken
      : never;

export { Role, IDToken, AccessToken, RefreshToken, DecodedToken };

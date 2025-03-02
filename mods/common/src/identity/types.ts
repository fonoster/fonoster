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
import { Role } from "@fonoster/types";

enum TokenUseEnum {
  ID = "id",
  ACCESS = "access",
  REFRESH = "refresh"
}

enum JsonWebErrorEnum {
  JsonWebTokenError = "JsonWebTokenError",
  TokenExpiredError = "TokenExpiredError"
}

type RoleType = {
  name: string;
  description: string;
  access: string[];
};

type Access = {
  accessKeyId: string;
  role: Role;
};

type BaseToken = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  tokenUse: TokenUseEnum;
  accessKeyId: string;
};

type IdToken = BaseToken & {
  emailVerified: boolean;
  phoneNumberVerified: boolean;
  phoneNumber: string;
  email: string;
  tokenUse: TokenUseEnum.ID;
};

type AccessToken = BaseToken & {
  access: Access[];
  tokenUse: TokenUseEnum.ACCESS;
};

type RefreshToken = BaseToken & {
  tokenUse: TokenUseEnum.REFRESH;
};

type DecodedToken<T extends TokenUseEnum> = T extends TokenUseEnum.ID
  ? IdToken
  : T extends TokenUseEnum.ACCESS
    ? AccessToken
    : T extends TokenUseEnum.REFRESH
      ? TokenUseEnum
      : never;

export {
  Access,
  AccessToken,
  DecodedToken,
  IdToken,
  RefreshToken,
  RoleType,
  TokenUseEnum,
  JsonWebErrorEnum
};

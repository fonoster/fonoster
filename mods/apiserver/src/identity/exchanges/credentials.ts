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
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import { GroupRoleEnum } from "../groups/GroupRoleEnum";
import TokenTypeEnum from "../TokenTypeEnum";
import { AccessToken } from "../types";

function exchangeCredentials(call, callback) {
  const signOptions = { algorithm: "RS256" } as jwt.SignOptions;
  const privateKey = fs.readFileSync(
    "/Users/psanders/Projects/fonoster/.keys/private.pem",
    "utf8"
  );

  const idTokenPayload = {
    iss: "https://identity-global.fonoster.io",
    sub: "635c0cd8-8125-483d-b467-05c53ce2cd31",
    iat: new Date().getTime() / 1000,
    tokenType: TokenTypeEnum.ACCESS,
    accessKeyId: "US14wj8q6qlirw331gfswusfblie6h78uz",
    scope: GroupRoleEnum.ADMIN
  } as AccessToken;

  const idToken = jwt.sign(idTokenPayload, privateKey, signOptions);

  callback(null, {
    idToken,
    accessToken: idToken,
    refreshToken: idToken
  });
}

export { exchangeCredentials };

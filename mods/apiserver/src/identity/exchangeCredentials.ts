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

function exchangeCredentials(call, callback) {
  console.log("exchangeCredentials", { request: call.request });
  const signOptions = { algorithm: "RS256" } as jwt.SignOptions;
  const privateKey = fs.readFileSync(
    "/Users/psanders/Projects/fonoster/.keys/private.pem",
    "utf8"
  );

  const idTokenPayload = {
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
    tokenType: "access",
    scope: "user"
  };

  const idToken = jwt.sign(idTokenPayload, privateKey, signOptions);

  callback(null, {
    idToken,
    accessToken: idToken,
    refreshToken: idToken
  });
}

export { exchangeCredentials };

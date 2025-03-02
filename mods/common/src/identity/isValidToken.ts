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
import { getLogger } from "@fonoster/logger";
import jwt from "jsonwebtoken";
import { JsonWebErrorEnum } from "./types";

const logger = getLogger({ service: "identity", filePath: __filename });

function isValidToken(token: string, secret: string): boolean {
  try {
    const decoded = jwt.verify(token, secret) as { exp: number };
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp <= currentTime) {
      logger.verbose("token expired", { exp: decoded.exp, currentTime });
      return false;
    }

    return true;
  } catch (error) {
    if (error.name === JsonWebErrorEnum.JsonWebTokenError) {
      logger.verbose("invalid JWT token", { token });
    } else if (error.name === JsonWebErrorEnum.TokenExpiredError) {
      logger.verbose("token expired", { token });
    } else {
      logger.verbose("unexpected JWT error:", error);
    }

    return false;
  }
}

export { isValidToken };

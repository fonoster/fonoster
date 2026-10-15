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
import { decodeToken, isValidToken } from "@fonoster/common";
import { NextFunction, Request, Response } from "express";

export type Caller = { accessKeyId: string; role: string; actor: string };

export const ADMIN_ROLES = ["WORKSPACE_OWNER", "WORKSPACE_ADMIN"];

/** Bearer access token + `x-accesskey-id` (same rules as the records API). */
export function createHttpAuth(identityPublicKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const accessKeyId = String(
      req.headers["x-accesskey-id"] ?? req.headers["accesskeyid"] ?? ""
    );
    if (!token || !isValidToken(token, identityPublicKey))
      return res.status(401).json({ error: "unauthenticated" });
    const decoded = decodeToken(token) as {
      sub?: string;
      accessKeyId?: string;
      access?: { accessKeyId: string; role: string }[];
    };
    const access = decoded.access?.find((a) => a.accessKeyId === accessKeyId);
    if (!accessKeyId || !access)
      return res.status(403).json({ error: "permission_denied" });
    res.locals.caller = {
      accessKeyId,
      role: access.role,
      actor: decoded.sub ?? decoded.accessKeyId ?? "unknown"
    } as Caller;
    next();
  };
}

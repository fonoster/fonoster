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

/** A signed-in user (regions belong to users, PR-14). */
export type UserCaller = { userRef: string };

export const ADMIN_ROLES = ["WORKSPACE_OWNER", "WORKSPACE_ADMIN"];

const bearer = (req: Request) => {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
};

type Decoded = {
  sub?: string;
  accessKeyId?: string;
  access?: { accessKeyId: string; role: string }[];
};

/** Bearer access token + `x-accesskey-id` (same rules as the records API). */
export function createHttpAuth(identityPublicKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = bearer(req);
    const accessKeyId = String(
      req.headers["x-accesskey-id"] ?? req.headers["accesskeyid"] ?? ""
    );
    if (!token || !isValidToken(token, identityPublicKey))
      return res.status(401).json({ error: "unauthenticated" });
    const decoded = decodeToken(token) as Decoded;
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

const userOf = (token: string, identityPublicKey: string) => {
  if (!token || !isValidToken(token, identityPublicKey)) return undefined;
  const decoded = decodeToken(token) as Decoded;
  return decoded.sub ? ({ userRef: decoded.sub } as UserCaller) : undefined;
};

/** A user-level call: a valid Bearer access token; its `sub` is the user (no workspace). */
export function createUserAuth(identityPublicKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = userOf(bearer(req), identityPublicKey);
    if (!user) return res.status(401).json({ error: "unauthenticated" });
    res.locals.user = user;
    next();
  };
}

/** Sets `res.locals.user` when a valid token is present; never refuses. */
export function optionalUser(identityPublicKey: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = userOf(bearer(req), identityPublicKey);
    if (user) res.locals.user = user;
    next();
  };
}

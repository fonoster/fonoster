/*
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
import React from "react";
import type { Session, SessionUser } from "../services/auth.interfaces";

export interface SessionProviderProps {
  children: React.ReactNode;
  initialSession: Session | null;
}

export interface SessionContextValue {
  isAuthenticated: boolean;
  session: Session | null;
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  setSession: (session: Session | null) => void;
}

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
export interface IDToken {
  iss: string;
  sub: string;
  aud: string;
  tokenUse: string;
  accessKeyId: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneNumberVerified: boolean;
  iat: number;
  exp: number;
}

export interface ExchangeCredentialsResponse {
  tokens: {
    idToken: string;
    accessToken: string;
    refreshToken: string;
  };
}

export interface Session {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface SessionFlashData {
  error: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface SessionRequest {
  session: Session | null;
  isAuthenticated: boolean;
}

export interface RequiredSessionRequest {
  session: Session;
  isAuthenticated: boolean;
}

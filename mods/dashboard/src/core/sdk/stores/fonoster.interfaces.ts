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
import type { Session } from "~/auth/services/sessions/session.interfaces";
import type { SDK } from "../client/fonoster.client";

/**
 * Props for the `FonosterProvider` component.
 *
 * This provider is used to wrap your application with Fonoster context,
 * initializing the client and session state for use throughout the app.
 */
export interface FonosterProviderProps {
  /**
   * React children elements that will be wrapped by the provider.
   */
  children: React.ReactNode;

  /**
   * The initial session data, typically passed in during app initialization.
   * Contains authentication tokens such as access and refresh tokens.
   */
  initialSession: Session | null;
}

/**
 * Interface describing the available Fonoster SDK modules that
 * are initialized and provided via context.
 */
export interface FonosterModules {
  /**
   * The Applications module from the Fonoster SDK.
   * Used to manage voice applications.
   */
  applications: SDK.Applications;

  // Add other modules as needed, e.g.:
  // agents: SDK.Agents;
  // voice: SDK.VoiceServer;
}

/**
 * Interface for the shape of the Fonoster context value.
 *
 * This context provides everything needed to interact with the Fonoster platform,
 * including the client instance, authentication state, session data, and SDK modules.
 */
export interface FonosterContextValue {
  /**
   * The current Fonoster client instance used to interact with the API.
   */
  client: SDK.WebClient | null;

  /**
   * The current user session containing authentication tokens.
   */
  session: Session | null;

  /**
   * Function to update the current session. Useful for handling login, logout,
   * or token refresh logic.
   */
  setSession: (session: Session | null) => void;

  /**
   * Function to log the user out and clear session data.
   */
  logout: () => void;

  /**
   * Boolean flag indicating whether the user is currently authenticated.
   */
  isAuthenticated: boolean;

  /**
   * The initialized SDK modules (e.g. Applications) tied to the current client.
   */
  sdk: FonosterModules | null;
}

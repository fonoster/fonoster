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

/**
 * Fonoster Runtime Configuration
 *
 * @description This file provides runtime configuration management for the Fonoster Dashboard.
 * It handles configuration loading from multiple sources with proper fallbacks for both
 * server-side and client-side environments.
 *
 * @note Runtime configuration values can change during application execution and are
 * loaded from environment variables or injected window objects.
 */

declare global {
  interface Window {
    __FONOSTER_RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Runtime configuration interface defining all available configuration options.
 *
 * @description Defines the structure for runtime configuration values that can be
 * dynamically loaded from environment variables or client-side injection.
 */
export interface RuntimeConfig {
  /** Indicates whether the application is running in development mode */
  DEVELOPMENT: boolean;
  /** API server connection configuration */
  APISERVER_CONNECTION: {
    /** gRPC server address for API communication */
    grpc_address: string;
    /** HTTP server address for API communication */
    http_address: string;
    /** Whether to allow insecure connections (useful for development) */
    allowInsecure: boolean;
  };
}

/**
 * Default runtime configuration values used as fallbacks.
 *
 * @description These values are used when no environment variables or
 * client-side configuration is available. Points to production endpoints by default.
 */
const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  DEVELOPMENT: false,
  APISERVER_CONNECTION: {
    grpc_address: "api.fonoster.com",
    http_address: "https://api.fonoster.com",
    allowInsecure: false
  }
};

/**
 * Reads an environment variable with a default value.
 *
 * @param key - The name of the environment variable to read
 * @param defaultValue - The default value to return if the variable is not set
 * @returns The value of the environment variable or the default value
 */
function readFromEnvWithDefault<T>(key: string, defaultValue: T): T {
  const rawValue = process.env[key] || import.meta.env?.[key];

  if (rawValue !== undefined) {
    if (typeof defaultValue === "boolean") {
      return (rawValue === "true") as T;
    }
    if (typeof defaultValue === "number") {
      const num = Number(rawValue);
      return (isNaN(num) ? defaultValue : num) as T;
    }
    return rawValue as unknown as T;
  }

  return defaultValue;
}

/**
 * Reads runtime configuration from the appropriate source based on the environment.
 *
 * @description This function implements a multi-tier configuration loading strategy:
 * 1. Server-side: Reads from process.env environment variables
 * 2. Client-side: First tries window.__FONOSTER_RUNTIME_CONFIG__ (injected config)
 * 3. Client-side fallback: Tries process.env if available
 * 4. Final fallback: Uses DEFAULT_RUNTIME_CONFIG values
 *
 * @returns {RuntimeConfig} The resolved runtime configuration object
 */
function getRuntimeConfig(): RuntimeConfig {
  const defaultConfig = DEFAULT_RUNTIME_CONFIG;
  // Helper to read from process.env with fallbacks
  const readFromEnv = (): RuntimeConfig => ({
    DEVELOPMENT:
      readFromEnvWithDefault<string>("NODE_ENV", "production") ===
      "development",
    APISERVER_CONNECTION: {
      grpc_address: readFromEnvWithDefault<string>(
        "DASHBOARD_APISERVER_GRPC_ADDRESS",
        defaultConfig.APISERVER_CONNECTION.grpc_address
      ),
      http_address: readFromEnvWithDefault<string>(
        "DASHBOARD_APISERVER_HTTP_ADDRESS",
        defaultConfig.APISERVER_CONNECTION.http_address
      ),
      allowInsecure: readFromEnvWithDefault<boolean>(
        "DASHBOARD_APISERVER_ALLOW_INSECURE",
        defaultConfig.APISERVER_CONNECTION.allowInsecure
      )
    }
  });

  const isServer = typeof window === "undefined";

  if (isServer) {
    return readFromEnv();
  }

  return window.__FONOSTER_RUNTIME_CONFIG__ || readFromEnv();
}

/**
 * The resolved runtime configuration object for the application.
 *
 * @description This is the main export that provides access to the current runtime
 * configuration. It is resolved once during module initialization and contains
 * the configuration values determined by the getRuntimeConfig() function.
 *
 * @example
 * ```typescript
 * import { RUNTIME_CONFIG } from './fonoster.runtime-config';
 *
 * // Access development mode flag
 * const isDev = RUNTIME_CONFIG.DEVELOPMENT;
 *
 * // Access API server configuration
 * const apiUrl = RUNTIME_CONFIG.APISERVER_CONNECTION.http_address;
 * ```
 */
export const RUNTIME_CONFIG: RuntimeConfig = getRuntimeConfig();

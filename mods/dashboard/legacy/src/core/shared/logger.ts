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
 * Logger utility class.
 *
 * Provides static methods for logging debug and error messages.
 * Debug logs are displayed only in development mode.
 *
 * Usage:
 * Logger.debug("This is a debug message", someVariable);
 * Logger.error("Something went wrong", error);
 */
export class Logger {
  /**
   * Determines if the application is running in development mode.
   * Controls whether debug logs are displayed.
   */
  private static readonly __IS_DEVELOPMENT__ = import.meta.env.DEV;

  /**
   * Logs a debug message to the console.
   *
   * Only displayed if the app is in development mode.
   *
   * @param message - The main debug message to display.
   * @param args - Optional additional arguments for context.
   */
  public static debug(message: string, ...args: any[]): void {
    if (!this.__IS_DEVELOPMENT__) {
      return;
    }

    console.info(
      `%cDEBUG: ${new Date().toLocaleString()}, ${message}`,
      "color:rgb(57, 225, 158); font-weight: bold;",
      JSON.stringify(args, null, 2)
    );
  }

  /**
   * Logs an error message to the console.
   *
   * Always displayed regardless of the environment.
   *
   * @param message - The main error message to display.
   * @param args - Optional additional arguments for context.
   */
  public static error(message: string, ...args: any[]): void {
    console.error(
      `%cDEBUG: ${new Date().toLocaleString()}, ${message}`,
      "color: #F44336; font-weight: bold;",
      JSON.stringify(args, null, 2)
    );
  }
}

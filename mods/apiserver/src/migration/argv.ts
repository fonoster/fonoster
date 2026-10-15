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
import { LegacyMigrationOptions } from "./migrateLegacy";

// Command-line options of fonoster-migrate-legacy.

export function arg(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function args(argv: string[], name: string): string[] {
  return argv
    .map((a, i) => (a === name ? argv[i + 1] : undefined))
    .filter((a): a is string => !!a);
}

export function optionsFromArgv(
  argv: string[],
  env: Record<string, string | undefined> = process.env
): LegacyMigrationOptions {
  const secretEnv = arg(argv, "--autopilot-secret-env");
  const refs = args(argv, "--app");
  return {
    dryRun: !argv.includes("--apply"),
    allowInsecureWebhooks: argv.includes("--allow-insecure-webhooks"),
    apps: {
      autopilotUrl: arg(argv, "--autopilot-url"),
      // The hosted Autopilot's secret, by environment variable name.
      autopilotSigningSecret: secretEnv ? env[secretEnv] : undefined,
      fallbackMessage: arg(argv, "--fallback-message"),
      refs: refs.length ? refs : undefined,
      ...(arg(argv, "--default-voice") || arg(argv, "--default-language")
        ? {
            defaults: {
              voice:
                arg(argv, "--default-voice") ?? "deepgram/aura-2-thalia-en",
              language: arg(argv, "--default-language") ?? "en-US"
            }
          }
        : {})
    }
  };
}

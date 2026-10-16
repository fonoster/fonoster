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
/**
 * Keeps a service up when a promise somewhere rejects without a handler (RV-B5): the reason is
 * logged and the process keeps serving, instead of Node's default of exiting. Install once in a
 * service's main.
 */
export function logUnhandledRejections(logger: {
  error: (message: string, meta?: Record<string, unknown>) => unknown;
}) {
  const handler = (reason: unknown) => {
    const e = reason as Error | undefined;
    logger.error(`unhandled rejection: ${e?.message ?? String(reason)}`, {
      stack: e?.stack
    });
  };
  process.on("unhandledRejection", handler);
  return () => process.off("unhandledRejection", handler);
}

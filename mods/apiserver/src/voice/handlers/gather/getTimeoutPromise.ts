/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { GatherSource } from "@fonoster/common";

interface PromiseWithResetTimer<T> extends Promise<T> {
  resetTimer?: () => void;
}

function getTimeoutPromise(source: GatherSource, timeout: number) {
  const defaultTimeout = source?.includes(GatherSource.SPEECH) ? 4000 : 10000;
  const effectiveTimeout = timeout || defaultTimeout;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let rejectTimeout: (reason?: Error) => void;

  const timeoutPromise = new Promise<string>((_, reject) => {
    rejectTimeout = reject;
    timeoutId = setTimeout(() => {
      reject(new Error("Gather timeout"));
    }, effectiveTimeout);
  }) as PromiseWithResetTimer<string>;

  timeoutPromise.resetTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        rejectTimeout(new Error("Gather timeout"));
      }, effectiveTimeout);
    }
  };

  return timeoutPromise;
}

export { getTimeoutPromise };

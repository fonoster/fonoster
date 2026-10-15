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
 * Runs database writes one after another, in the order they were queued, behind a synchronous
 * store interface (the registry and webhook stores are synchronous; see P-B1 in
 * add-provider-registry/build-log.md). `flush()` waits for every queued write and throws the
 * first failure.
 */
export class WriteBehind {
  private tail: Promise<void> = Promise.resolve();
  private failure?: unknown;

  constructor(private readonly onError?: (e: unknown) => void) {}

  push(write: () => Promise<unknown>) {
    this.tail = this.tail.then(async () => {
      try {
        await write();
      } catch (e) {
        this.failure ??= e;
        this.onError?.(e);
      }
    });
  }

  async flush() {
    await this.tail;
    const failure = this.failure;
    this.failure = undefined;
    if (failure) throw failure;
  }
}

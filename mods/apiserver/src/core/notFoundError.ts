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
import { status } from "@grpc/grpc-js";

/**
 * A NOT_FOUND error. The caller gets "The requested resource was not found" unless the error
 * is marked public, in which case the caller gets `message` as written.
 *
 * Mark an error public only when it comes from a lookup that filters by the caller's
 * accessKeyId. Never mark the error of a `withAccess` getFn: an unknown ref and another
 * workspace's ref must answer the same message, or callers could probe other workspaces' refs.
 */
const notFoundError = (message: string, options?: { public?: boolean }) => ({
  code: status.NOT_FOUND,
  message,
  ...(options?.public ? { public: true } : {})
});

export { notFoundError };

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
import { GrpcError } from "@fonoster/common";
import { status } from "@grpc/grpc-js";
import { Prisma } from "../core/db";

function createCheckNumberPreconditions(prisma: Prisma) {
  return async function checkNumberPreconditions({ appRef, accessKeyId }) {
    // You can have a Number without an Application but it must exist
    if (!appRef) {
      return;
    }

    const app = await prisma.application.findUnique({
      where: { ref: appRef, accessKeyId }
    });

    if (!app) {
      throw new GrpcError(
        status.INVALID_ARGUMENT,
        "Application not found for ref: " + appRef
      );
    }
  };
}

export { createCheckNumberPreconditions };

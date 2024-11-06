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
import {
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { VerifyCodeRequest } from "./types";
import { Prisma } from "../db";

function createVerifyCode(prisma: Prisma) {
  const fn = async (
    call: { request: VerifyCodeRequest },
    callback: (error: GrpcErrorMessage) => void
  ) => {
    const { request } = call;

    callback(null);
  };

  return withErrorHandlingAndValidation(fn, V.verifyCodeRequestSchema);
}

export { createVerifyCode };

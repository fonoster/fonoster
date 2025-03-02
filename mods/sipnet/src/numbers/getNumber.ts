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
import {
  GrpcErrorMessage,
  Validators as V,
  withErrorHandlingAndValidation
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { BaseApiObject, NumbersApi } from "@fonoster/types";
import { convertToFonosterNumber } from "./convertToFonosterNumber";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function getNumber(api: NumbersApi) {
  const fn = async (
    call: { request: BaseApiObject },
    callback: (error?: GrpcErrorMessage, response?: BaseApiObject) => void
  ) => {
    const { request } = call;
    const { ref } = request;

    logger.verbose("call to getNumber", { ref });

    const response = await api.getNumber(ref);

    callback(null, convertToFonosterNumber(response));
  };

  return withErrorHandlingAndValidation(fn, V.emptySchema);
}

export { getNumber };

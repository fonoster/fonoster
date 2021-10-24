/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import {FonosError, ErrorCodes} from "@fonos/errors";

// TODO: Move to @fonos/common
export const assertNotEmpty = (name: string, value: string): void => {
  if (value.length == 0)
    throw new FonosError(
      `the parameter '${name}' is required but was not found`,
      ErrorCodes.INVALID_ARGUMENT
    );
};

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
import {GatherOptions} from "./types";

export const assertsHasNumDigitsOrTimeout = (options: GatherOptions) => {
  if (!options.numDigits && !options.timeout) {
    throw new Error("you must provide either 'numDigits' or 'timeout' option");
  }
};

export const assertsValuesArePositive = (options: GatherOptions) => {
  if (
    options.timeout !== undefined &&
    options.timeout < 0 &&
    !isNaN(options.timeout)
  ) {
    throw new Error(
      "the option 'timeout' must be a number equal or greater than zero"
    );
  }

  if (
    options.numDigits !== undefined &&
    options.numDigits <= 0 &&
    !isNaN(options.numDigits)
  ) {
    throw new Error(
      "the option 'numDigits' must be a number greater than zero"
    );
  }
};

export const assertsFinishOnKeyIsChar = (options: GatherOptions) => {
  const isKey = (key: string) =>
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#"].indexOf(key) !=
    -1;

  if (
    options.finishOnKey &&
    options.finishOnKey.length > 1 &&
    !isKey(options.finishOnKey)
  ) {
    throw new Error(
      "the option 'finishOnKey' must be a single char [0-9], *, or #"
    );
  }
};

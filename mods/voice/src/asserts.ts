/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
export const assertsValueIsPositive = (name: string, value: any) => {
  if (value !== undefined && value <= 0 && !isNaN(value)) {
    throw new Error(`the option '${name}' must be a number greater than zero`);
  }
};

export const assertsValuesIsZeroOrGreater = (name: string, value: any) => {
  if (value !== undefined && value < 0 && !isNaN(value)) {
    throw new Error(
      `the option '${name}' must be a number equal or greater than zero`
    );
  }
};

export const assertsFinishOnKeyIsChar = (key: string) => {
  const isKey = (key: string) =>
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#"].indexOf(key) !=
    -1;

  if (key && key.length > 1 && !isKey(key)) {
    throw new Error(
      "the option 'finishOnKey' must be a single char [0-9], *, or #"
    );
  }
};

export const assertPluginExist = (self, pluginName) => {
  if (!self.plugins[pluginName]) {
    throw Error("No available plugin for tts");
  }
};

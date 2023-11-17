/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import { Level as Le } from "./protos/monitor_pb";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Level {
  // eslint-disable-next-line require-jsdoc
  export function toString(level: Le): string {
    return Object.keys(Le)
      .find((key) => Le[key] === level)
      .toLowerCase();
  }

  // eslint-disable-next-line require-jsdoc
  export function fromString(dir: string): Le {
    return (Le as unknown)[dir?.toUpperCase()];
  }
}

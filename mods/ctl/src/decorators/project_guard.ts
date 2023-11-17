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
import { CLIError } from "@oclif/errors";
import { hasProjectConfig } from "../config";

/**
 * Project Guard
 *
 * @description Guardian that is responsible for validating that a default project exists.
 *
 * @return {*}  {MethodDecorator}
 * @author Fonoster
 */
export const ProjectGuard = function (): MethodDecorator {
  return function (
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args) {
      if (!hasProjectConfig()) {
        throw new CLIError(
          "you must set a default project before using this command"
        );
      }

      return method.apply(this, args);
    };

    return descriptor;
  };
};

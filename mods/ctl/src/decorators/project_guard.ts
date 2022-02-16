import {CLIError} from "@oclif/errors";
import {hasProjectConfig} from "../config";

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

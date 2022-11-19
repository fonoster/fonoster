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
import "../config";
import Command from "@oclif/command";
import { Input } from "@oclif/parser";
import { CliUx } from "@oclif/core";
import { CLIError } from "@oclif/errors";

export default abstract class extends Command {
  ref: string;

  async deleteResource(API: any, funcName: string) {
    if (!this.ref) {
      CliUx.ux.action.stop();
      throw new CLIError("You must provide a resource ref before continuing");
    }

    CliUx.ux.action.start(`Deleting resource ${this.ref}`);
    const results = await API[funcName](this.ref);

    await CliUx.ux.wait(1000);
    CliUx.ux.action.stop(results ? "Done" : "Failed");
  }

  async init() {
    const { args } = this.parse(<Input<any>>this.constructor);
    this.ref = args.ref;
  }

  async catch(err: any) {
    return super.catch(err);
  }

  async finally(err: any) {
    return super.finally(err);
  }
}

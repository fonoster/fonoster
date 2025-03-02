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
import { Command, Flags, Interfaces } from "@oclif/core";

export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // define flags that can be inherited by any command that extends BaseCommand
  static readonly baseFlags = {
    insecure: Flags.boolean({
      char: "i",
      description: "allow connections to a server with no TLS",
      default: false
    })
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  public async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      enableJsonFlag: this.ctor.enableJsonFlag,
      args: this.ctor.args,
      strict: this.ctor.strict
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
  }

  protected async catch(err: Error & { exitCode?: number }) {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err);
  }

  protected async finally(_: Error | undefined) {
    // called after run and catch regardless of whether or not the command errored
    return super.finally(_);
  }
}

// eslint-disable-next-line no-redeclare
export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)["baseFlags"] & T["flags"]
>;

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

/** Fonoster clients always use TLS: --insecure is gone, trust the install's CA instead. */
export const REMOVED_INSECURE =
  "--insecure was removed: the CLI always uses TLS. To reach an install that uses its generated certificate, trust its CA with --ca-file <path> (the install's config/tls/ca.pem) or FONOSTER_CA_FILE.";

/** A hint for TLS verification failures, appended to the error. */
export function caHint(message: string): string {
  return /self[- ]signed|unable to (get|verify)|certificate|CERT_|unknown authority/i.test(
    message
  )
    ? `${message}\nThe server's certificate isn't trusted. If it's an install's generated certificate, pass --ca-file <path to its config/tls/ca.pem> or set FONOSTER_CA_FILE.`
    : message;
}

export abstract class BaseCommand<T extends typeof Command> extends Command {
  // define flags that can be inherited by any command that extends BaseCommand
  static readonly baseFlags = {
    "ca-file": Flags.string({
      description:
        "a PEM file of certificate authorities to trust, such as an install's config/tls/ca.pem (default: FONOSTER_CA_FILE)"
    })
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  public async init(): Promise<void> {
    await super.init();
    if (this.argv.some((a) => a === "--insecure" || a === "-i"))
      this.error(REMOVED_INSECURE, { exit: 2 });
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

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
import * as SDK from "@fonoster/sdk";
import { confirm, input, password, select } from "@inquirer/prompts";
import { Args, Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";

type TwilioCredentials =
  | { accountSid: string; authToken: string }
  | { accountSid: string; apiKeySid: string; apiKeySecret: string };

export default class LinkTwilio extends AuthenticatedCommand<
  typeof LinkTwilio
> {
  static override readonly description =
    "link a number from your Twilio account to the active workspace";
  static override readonly aliases = ["sipnet:numbers:linkTwilioNumber"];
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> +18095550123 --app <ref>   # asks for what's missing",
    "TWILIO_API_KEY_SECRET=... <%= config.bin %> <%= command.id %> +18095550123 --account-sid AC... --api-key-sid SK... --app <ref> --yes"
  ];
  static override readonly args = {
    phoneNumber: Args.string({
      description:
        "the number to link, in E.164 (it must be in your Twilio account)",
      required: true
    })
  };
  static override readonly flags = {
    name: Flags.string({
      description: "the Number's name (default: the phone number)"
    }),
    app: Flags.string({
      description: "the Application that answers the number",
      exclusive: ["agent"]
    }),
    agent: Flags.string({
      description: "the SIP agent (AOR) that answers the number",
      exclusive: ["app"]
    }),
    "account-sid": Flags.string({
      description: "the Twilio Account SID (AC...)"
    }),
    "api-key-sid": Flags.string({
      description:
        "a Twilio Standard API key SID (SK...); the secret is read from TWILIO_API_KEY_SECRET or a masked prompt",
      exclusive: ["auth-token"]
    }),
    "auth-token": Flags.boolean({
      description:
        "sign in with the Auth Token instead of an API key; it is read from TWILIO_AUTH_TOKEN or a masked prompt",
      exclusive: ["api-key-sid"]
    }),
    yes: Flags.boolean({
      description:
        "link without asking, replacing the trunk and route of a number already in the workspace"
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(LinkTwilio);
    const { phoneNumber } = args;
    const interactive = Boolean(process.stdin.isTTY);
    const client = await this.createSdkClient();
    const numbers = new SDK.Numbers(client);

    let route: { appRef: string } | { agentAor: string } | undefined;
    if (flags.app) {
      route = { appRef: flags.app };
    } else if (flags.agent) {
      route = { agentAor: flags.agent };
    } else if (interactive) {
      const apps = await new SDK.Applications(client).listApplications({
        pageSize: 1000
      });
      const appRef = await select<string | null>({
        message: "Application",
        choices: [{ name: "None", value: null as string | null }].concat(
          apps.items.map((app) => ({ name: app.name, value: app.ref }))
        )
      });
      route = appRef ? { appRef } : undefined;
    }

    const credentials = await this.readCredentials(flags, interactive);

    const inWorkspace = (
      await numbers.listNumbers({ pageSize: 1000 })
    ).items.some((number) => number.telUrl === `tel:${phoneNumber}`);

    if (!flags.yes && inWorkspace && !interactive) {
      this.error(
        `${phoneNumber} is already in this workspace; pass --yes to replace its trunk and route.`,
        { exit: 1 }
      );
    }

    if (!flags.yes && interactive) {
      const target = route
        ? ` to ${"appRef" in route ? route.appRef : route.agentAor}`
        : "";
      const replaces = inWorkspace
        ? " This number is already in your workspace; linking replaces its trunk and route."
        : "";
      const ready = await confirm({
        message: `Link ${phoneNumber}${target}? Fonoster moves this number onto a SIP trunk in your Twilio account; its current voice settings in Twilio stop handling calls.${replaces}`
      });

      if (!ready) {
        this.log("Aborted!");
        return;
      }
    }

    let linked: { ref: string; trunkRef: string };
    try {
      linked = await numbers.linkTwilio({
        phoneNumber,
        name: flags.name ?? phoneNumber,
        credentials,
        ...route
      });
    } catch (e) {
      // A gRPC error carries the server's text in details; its message adds the status prefix.
      const error = e as { details?: string; message: string };
      this.error(`Failed to link number: ${error.details || error.message}`, {
        exit: 1
      });
    }

    this.log(
      `Linked ${phoneNumber} (number ${linked.ref}) on Twilio Trunk (${linked.trunkRef}).`
    );
  }

  private async readCredentials(
    flags: {
      "account-sid"?: string;
      "api-key-sid"?: string;
      "auth-token": boolean;
    },
    interactive: boolean
  ): Promise<TwilioCredentials> {
    const accountSid =
      flags["account-sid"] ??
      (interactive
        ? await input({ message: "Twilio Account SID", required: true })
        : this.error("Missing --account-sid.", { exit: 1 }));

    let kind: "apiKey" | "authToken";
    if (flags["api-key-sid"]) {
      kind = "apiKey";
    } else if (flags["auth-token"]) {
      kind = "authToken";
    } else if (interactive) {
      kind = await select<"apiKey" | "authToken">({
        message: "How do you sign in to Twilio?",
        choices: [
          { name: "API key (recommended: a Standard key)", value: "apiKey" },
          {
            name: "Auth Token (gives full access to your Twilio account)",
            value: "authToken"
          }
        ]
      });
    } else {
      this.error("Missing --api-key-sid or --auth-token.", { exit: 1 });
    }

    if (kind === "authToken") {
      const authToken =
        process.env.TWILIO_AUTH_TOKEN ||
        (interactive
          ? await password({ message: "Twilio Auth Token" })
          : this.error("Missing TWILIO_AUTH_TOKEN.", { exit: 1 }));
      return { accountSid, authToken };
    }

    const apiKeySid =
      flags["api-key-sid"] ??
      (await input({ message: "API key SID", required: true }));
    const apiKeySecret =
      process.env.TWILIO_API_KEY_SECRET ||
      (interactive
        ? await password({ message: "API key secret" })
        : this.error("Missing TWILIO_API_KEY_SECRET.", { exit: 1 }));
    return { accountSid, apiKeySid, apiKeySecret };
  }
}

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
import { LinkWhatsAppRequest, LinkWhatsAppResponse } from "@fonoster/types";
import { confirm, password, select } from "@inquirer/prompts";
import { Args, Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";

type Route = { appRef: string } | { agentAor: string };

export default class LinkWhatsApp extends AuthenticatedCommand<
  typeof LinkWhatsApp
> {
  static override readonly description =
    "link a WhatsApp Business number to the active workspace";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> --phone-number-id 106612345678901 --app <ref>   # asks for the token and what's missing",
    "META_ACCESS_TOKEN=... <%= config.bin %> <%= command.id %> --phone-number-id 106612345678901 --app <ref> --yes",
    "WHATSAPP_SIP_PASSWORD=... <%= config.bin %> <%= command.id %> +525512345678 --app <ref> --yes   # you set up Meta yourself"
  ];
  static override readonly args = {
    phoneNumber: Args.string({
      description:
        "the WhatsApp Business number, in E.164; only when you set up Meta yourself (no --phone-number-id)"
    })
  };
  static override readonly flags = {
    "phone-number-id": Flags.string({
      description:
        "Meta's id of the phone number (WhatsApp Manager > Phone numbers); Fonoster then sets up Meta with a token read from META_ACCESS_TOKEN or a masked prompt"
    }),
    name: Flags.string({
      description:
        "the Number's name (default: Meta's verified name, or the phone number)"
    }),
    app: Flags.string({
      description: "the Application that answers the number",
      exclusive: ["agent"]
    }),
    agent: Flags.string({
      description: "the SIP agent (AOR) that answers the number",
      exclusive: ["app"]
    }),
    yes: Flags.boolean({
      description: "skip the confirmation; required without a terminal"
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(LinkWhatsApp);
    const phoneNumber = args.phoneNumber?.trim();
    const phoneNumberId = flags["phone-number-id"]?.trim();
    const interactive = Boolean(process.stdin.isTTY);

    if (phoneNumber && phoneNumberId) {
      this.error(
        "Pass either the phone number or --phone-number-id, not both.",
        { exit: 2 }
      );
    }
    if (!phoneNumber && !phoneNumberId) {
      this.error("Pass the phone number or --phone-number-id.", { exit: 2 });
    }

    const client = await this.createSdkClient();
    const numbers = new SDK.Numbers(client);

    let route: Route | undefined;
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

    // The secret, never from a flag: the token (Fonoster sets up Meta) or the password (you do)
    let secret: { accessToken: string } | { sipPassword?: string };
    if (phoneNumberId) {
      const accessToken =
        process.env.META_ACCESS_TOKEN?.trim() ||
        (interactive
          ? await password({
              message:
                "Meta access token (System User, whatsapp_business_management)"
            })
          : this.error("Set META_ACCESS_TOKEN to link without a terminal.", {
              exit: 1
            }));
      secret = { accessToken: accessToken.trim() };
    } else {
      const sipPassword = (
        process.env.WHATSAPP_SIP_PASSWORD ??
        (interactive
          ? await password({
              message: "SIP password from Meta (leave empty to set it later)"
            })
          : "")
      ).trim();
      secret = sipPassword ? { sipPassword } : {};
    }

    if (!flags.yes && !interactive) {
      this.error("Pass --yes to link without confirmation.", { exit: 1 });
    }

    if (!flags.yes) {
      const target = route
        ? "appRef" in route
          ? route.appRef
          : route.agentAor
        : "no route";
      const message = phoneNumberId
        ? `Link WhatsApp number ${phoneNumberId} to ${target}? Fonoster turns on SIP calling for it in Meta, points it at Fonoster and keeps the SIP password Meta issues; the token is used once.`
        : `Link ${phoneNumber} to ${target}? Fonoster creates its WhatsApp trunk and gives you the SIP server to register in WhatsApp Manager. A number already in your workspace moves to that trunk and route.`;
      if (!(await confirm({ message }))) {
        this.log("Aborted!");
        return;
      }
    }

    const request: LinkWhatsAppRequest = {
      ...(phoneNumberId ? { phoneNumberId } : { phoneNumber }),
      ...secret,
      ...(flags.name ? { name: flags.name } : {}),
      ...route
    };

    let linked: LinkWhatsAppResponse;
    try {
      linked = await numbers.linkWhatsApp(request);
    } catch (e) {
      // A gRPC error carries the server's text in details; its message adds the status prefix.
      const error = e as { details?: string; message: string };
      this.error(`Failed to link number: ${error.details || error.message}`, {
        exit: 1
      });
    }

    const who = linked.verifiedName
      ? `${linked.phoneNumber} (${linked.verifiedName})`
      : linked.phoneNumber;
    this.log(
      `Linked ${who} (number ${linked.ref}) on WhatsApp Trunk ${linked.phoneNumber} (${linked.trunkRef}).`
    );
    if (linked.metaConfigured) {
      this.log(
        `SIP calling is on in WhatsApp, pointed at ${linked.sipServerHostname}:${linked.sipServerPort} with SDES.`
      );
      return;
    }
    this.log(
      `Register this SIP server in WhatsApp Manager: ${linked.sipServerHostname} (port ${linked.sipServerPort}).`
    );
    this.log(
      linked.sipPasswordSet
        ? "SIP password: set."
        : "SIP password: not set yet. Run the command again with WHATSAPP_SIP_PASSWORD once you have it from Meta."
    );
  }
}

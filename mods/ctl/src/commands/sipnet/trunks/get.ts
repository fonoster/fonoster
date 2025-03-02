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
import { Args } from "@oclif/core";
import cliui from "cliui";
import moment from "moment";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import { getOutboundUri } from "../../../utils/getOutboundUri";

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of a Trunk by reference";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "The Trunk's reference",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);
    const { ref } = args;
    const client = await this.createSdkClient();
    const trunks = new SDK.Trunks(client);
    const credentials = new SDK.Credentials(client);
    const acls = new SDK.Acls(client);

    const response = await trunks.getTrunk(ref);
    const credentialsList = await credentials.listCredentials({
      pageSize: 1000
    });
    const aclList = await acls.listAcls({
      pageSize: 1000
    });

    const inboundCredentialsObject = credentialsList.items.find(
      (item) => item.ref === response.inboundCredentialsRef
    );

    const outboundCredentialsObject = credentialsList.items.find(
      (item) => item.ref === response.outboundCredentialsRef
    );

    const acl = aclList.items.find(
      (item) => item.ref === response.accessControlListRef
    );

    const ui = cliui({ width: 200 });

    ui.div(
      "TRUNK DETAILS\n" +
        "------------------\n" +
        `NAME: \t${response.name}\n` +
        `REF: \t${response.ref}\n` +
        `INBOUND URI: \t${response.inboundUri ?? ""}\n` +
        `INBOUND CREDENTIALS: \t${inboundCredentialsObject?.name ?? ""}\n` +
        `INBOUND CREDENTIALS REF: \t${inboundCredentialsObject?.ref ?? ""}\n` +
        `ACL: \t${acl?.name ?? ""}\n` +
        `ACL REF: \t${acl?.ref ?? ""}\n` +
        `OUTBOUND URIS: \t${getOutboundUri(response.uris)}\n` +
        `OUTBOUND CREDENTIALS: \t${outboundCredentialsObject?.name ?? ""}\n` +
        `OUTBOUND CREDENTIALS REF: \t${outboundCredentialsObject?.ref ?? ""}\n` +
        `CREATED: \t${moment(response.createdAt).format("YYYY-MM-DD HH:mm:ss")}\n` +
        `UPDATED: \t${moment(response.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`
    );

    this.log(ui.toString());
  }
}

/*
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
import type { ColumnDef } from "@tanstack/react-table";
import type { Trunk } from "@fonoster/types";

/**
 * Column definitions for rendering a table of Fonoster Trunks using TanStack Table.
 *
 * Each column maps a property of the `Trunk` object to a table header and cell.
 * This configuration enables sorting, filtering, and custom rendering in table UIs.
 */
export const columns: ColumnDef<Trunk>[] = [
  {
    /**
     * Unique identifier for the trunk.
     *
     * Typically a UUID or internal reference string used to identify the row uniquely.
     */
    id: "ref",
    header: "Ref",
    accessorKey: "ref"
  },
  {
    /**
     * Human-readable name of the trunk.
     *
     * Often used by users to easily identify the trunk in the UI.
     */
    id: "name",
    header: "Name",
    accessorKey: "name"
  },
  {
    /**
     * Indicates whether the trunk is configured to send SIP REGISTER requests.
     *
     * Typically a boolean or string value.
     */
    id: "sendRegister",
    header: "Send Register",
    accessorKey: "sendRegister"
  },
  {
    /**
     * URI used by the trunk for inbound SIP traffic.
     *
     * This field helps configure SIP endpoints and routing.
     */
    id: "inboundUri",
    header: "Inbound SIP",
    accessorKey: "inboundUri"
  },
  {
    /**
     * Reference to the credentials object used for outbound SIP authentication.
     *
     * Typically a UUID or name of the credentials resource.
     */
    id: "outboundCredentialsRef",
    header: "Outbound Credentials",
    accessorKey: "outboundCredentialsRef"
  }
];

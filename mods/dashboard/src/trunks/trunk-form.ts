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
import type {
  CreateTrunkRequest,
  NumberFormat,
  Transport,
  Trunk
} from "@fonoster/types";
import { z } from "zod";

type TrunkURI = NonNullable<CreateTrunkRequest["uris"]>[number];

export const TRANSPORTS = ["UDP", "TCP", "TLS", "SCTP", "WS", "WSS"] as const;

/** Radix Select can't hold "", so "no ACL / no credentials" is this. */
export const NONE = "none";

// Same idea as the API (common/src/validators/sipnet/trunks.ts): an IPv4 or a domain.
const HOST =
  /^((\d{1,3}\.){3}\d{1,3}|([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;
const host = (what: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${what}`)
    .regex(HOST, "Use a domain like sip.carrier.com or an IP address");

const integer = (min: number, max: number, message: string) =>
  z.number({ error: message }).int(message).min(min, message).max(max, message);

export const uriSchema = z.object({
  host: host("host"),
  port: integer(1, 65535, "1–65535"),
  transport: z.enum(TRANSPORTS),
  user: z.string().trim(),
  priority: integer(0, 65535, "0 or more"),
  weight: integer(0, 65535, "0 or more"),
  enabled: z.boolean()
});

/** The outbound number formats, with a fixed example for a GB number. */
export const NUMBER_FORMAT_OPTIONS = [
  { value: "NUMBER_FORMAT_UNSPECIFIED", label: "Leave as is" },
  { value: "E164", label: "+E.164", description: "+442079460018" },
  {
    value: "E164_WITHOUT_PLUS",
    label: "E.164 without +",
    description: "442079460018"
  },
  {
    value: "NATIONAL",
    label: "National",
    description: "02079460018"
  },
  {
    value: "INTERNATIONAL",
    label: "International",
    description: "00442079460018"
  }
];

/** Routr takes a prefix only with these formats (fonoster/routr#704). */
export function takesPrefix(format: string): boolean {
  return (
    format === "E164_WITHOUT_PLUS" ||
    format === "NATIONAL" ||
    format === "INTERNATIONAL"
  );
}

const PREFIX = /^[0-9*#]{1,20}$/;
const prefix = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || PREFIX.test(value),
    "Use only digits, * and #, up to 20."
  );

/**
 * Trunks made by Link Twilio and Link WhatsApp: another number format would break their calls,
 * so the page doesn't offer one.
 */
export function offersNumberFormats(uris: { host: string }[]): boolean {
  return !uris.some(
    ({ host }) =>
      host.toLowerCase().endsWith(".pstn.twilio.com") ||
      host.toLowerCase() === "wa.meta.vc"
  );
}

export const trunkSchema = z.object({
  name: z.string().trim().min(1, "Enter a name"),
  inboundUri: host("inbound URI"),
  sendRegister: z.boolean(),
  accessControlListRef: z.string(),
  inboundCredentialsRef: z.string(),
  outboundCredentialsRef: z.string(),
  uris: z.array(uriSchema),
  calledNumberFormat: z.string(),
  calledNumberPrefix: prefix,
  callerNumberFormat: z.string(),
  callerNumberPrefix: prefix
});

export type TrunkValues = z.infer<typeof trunkSchema>;

export type UriValues = z.infer<typeof uriSchema>;

export const NEW_URI: UriValues = {
  host: "",
  port: 5060,
  transport: "UDP",
  user: "",
  priority: 1,
  weight: 10,
  enabled: true
};

type Nested = { ref?: string } | undefined;

/**
 * The trunk's ACL and credentials refs. getTrunk returns them as refs, but
 * listTrunks returns the nested objects instead.
 */
export function trunkRefs(trunk: Trunk) {
  const nested = trunk as Trunk & {
    accessControlList?: Nested;
    inboundCredentials?: Nested;
    outboundCredentials?: Nested;
  };
  return {
    accessControlListRef:
      trunk.accessControlListRef || nested.accessControlList?.ref || undefined,
    inboundCredentialsRef:
      trunk.inboundCredentialsRef ||
      nested.inboundCredentials?.ref ||
      undefined,
    outboundCredentialsRef:
      trunk.outboundCredentialsRef ||
      nested.outboundCredentials?.ref ||
      undefined
  };
}

export function toValues(trunk?: Trunk): TrunkValues {
  if (!trunk) {
    return {
      name: "",
      inboundUri: "",
      sendRegister: false,
      accessControlListRef: NONE,
      inboundCredentialsRef: NONE,
      outboundCredentialsRef: NONE,
      uris: [{ ...NEW_URI }],
      calledNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
      calledNumberPrefix: "",
      callerNumberFormat: "NUMBER_FORMAT_UNSPECIFIED",
      callerNumberPrefix: ""
    };
  }
  const refs = trunkRefs(trunk);
  return {
    name: trunk.name,
    inboundUri: trunk.inboundUri ?? "",
    sendRegister: Boolean(trunk.sendRegister),
    accessControlListRef: refs.accessControlListRef ?? NONE,
    inboundCredentialsRef: refs.inboundCredentialsRef ?? NONE,
    outboundCredentialsRef: refs.outboundCredentialsRef ?? NONE,
    uris: (trunk.uris ?? []).map((uri) => ({
      host: uri.host,
      port: uri.port,
      transport: (TRANSPORTS as readonly string[]).includes(uri.transport)
        ? (uri.transport as UriValues["transport"])
        : "UDP",
      user: uri.user ?? "",
      priority: uri.priority,
      weight: uri.weight,
      enabled: Boolean(uri.enabled)
    })),
    calledNumberFormat: trunk.calledNumberFormat ?? "NUMBER_FORMAT_UNSPECIFIED",
    calledNumberPrefix: trunk.calledNumberPrefix ?? "",
    callerNumberFormat: trunk.callerNumberFormat ?? "NUMBER_FORMAT_UNSPECIFIED",
    callerNumberPrefix: trunk.callerNumberPrefix ?? ""
  };
}

const ref = (value: string) => (value === NONE ? undefined : value);

export function toRequest(values: TrunkValues): CreateTrunkRequest {
  return {
    name: values.name,
    inboundUri: values.inboundUri,
    sendRegister: values.sendRegister,
    accessControlListRef: ref(values.accessControlListRef),
    inboundCredentialsRef: ref(values.inboundCredentialsRef),
    outboundCredentialsRef: ref(values.outboundCredentialsRef),
    uris: values.uris.map((uri): TrunkURI => ({
      host: uri.host,
      port: uri.port,
      transport: uri.transport as Transport,
      ...(uri.user ? { user: uri.user } : {}),
      priority: uri.priority,
      weight: uri.weight,
      enabled: uri.enabled
    })),
    // All four, always: an absent field keeps the stored value, and Routr checks the Trunk as it
    // would be stored, so "Leave as is" goes with an empty prefix.
    calledNumberFormat: values.calledNumberFormat as NumberFormat,
    calledNumberPrefix: takesPrefix(values.calledNumberFormat)
      ? values.calledNumberPrefix.trim()
      : "",
    callerNumberFormat: values.callerNumberFormat as NumberFormat,
    callerNumberPrefix: takesPrefix(values.callerNumberFormat)
      ? values.callerNumberPrefix.trim()
      : ""
  };
}

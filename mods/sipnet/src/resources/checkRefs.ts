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
import { GrpcError } from "@fonoster/common";
import { status } from "@grpc/grpc-js";
import SDK from "@routr/sdk";
import { ClientOptions } from "../types";

// A SIP resource may only reference resources of its own workspace (security review H7): a
// trunk with another workspace's credentials or ACL, an agent in another workspace's domain, a
// domain egressing through another workspace's number or a number on another workspace's trunk
// would use that workspace's carrier account or identity. Routr has no notion of workspaces, so
// the check is here: every reference must name a resource whose `extended.accessKeyId` is the
// caller's.

type RefKind = "Acl" | "Credentials" | "Domain" | "Number" | "Trunk";

type OwnedResource =
  { extended?: Record<string, unknown> | null } | null | undefined;

type RefLookups = Record<RefKind, (ref: string) => Promise<OwnedResource>>;

/** One reference in a request: the request field, what it names and its value. */
type RefField = { field: string; kind: RefKind; ref?: string | null };

type CheckRefs = (
  accessKeyId: string | undefined,
  refs: RefField[]
) => Promise<void>;

/** A request's references, checked before it reaches Routr. */
type CheckRequestRefs<R> = (
  request: R,
  accessKeyId: string | undefined
) => Promise<void>;

const isNotFound = (e: unknown) =>
  (e as { code?: number })?.code === status.NOT_FOUND;

function createCheckRefs(lookups: Partial<RefLookups>): CheckRefs {
  return async (accessKeyId, refs) => {
    const given = refs.filter((r) => typeof r.ref === "string" && r.ref !== "");
    if (given.length === 0) return;
    if (!accessKeyId) {
      throw new GrpcError(
        status.PERMISSION_DENIED,
        "the caller's workspace is required to reference other resources"
      );
    }
    for (const { field, kind, ref } of given) {
      const lookup = lookups[kind];
      if (!lookup) throw new Error(`no lookup for ${kind} references`);
      let resource: OwnedResource;
      try {
        resource = await lookup(ref as string);
      } catch (e) {
        if (!isNotFound(e)) throw e;
        resource = undefined;
      }
      // Another workspace's resource is reported like a missing one, so refs of other
      // workspaces are not confirmed.
      if (resource?.extended?.accessKeyId !== accessKeyId) {
        throw new GrpcError(
          status.INVALID_ARGUMENT,
          `${field} ${ref} not found`
        );
      }
    }
  };
}

/** The production lookups: Routr's API, one client per kind. */
function createRefLookups(clientOptions: ClientOptions): RefLookups {
  const acls = new SDK.Acls(clientOptions);
  const credentials = new SDK.Credentials(clientOptions);
  const domains = new SDK.Domains(clientOptions);
  const numbers = new SDK.Numbers(clientOptions);
  const trunks = new SDK.Trunks(clientOptions);
  return {
    Acl: (ref) => acls.getAcl(ref) as Promise<OwnedResource>,
    Credentials: (ref) =>
      credentials.getCredentials(ref) as Promise<OwnedResource>,
    Domain: (ref) => domains.getDomain(ref) as Promise<OwnedResource>,
    Number: (ref) => numbers.getNumber(ref) as Promise<OwnedResource>,
    Trunk: (ref) => trunks.getTrunk(ref) as Promise<OwnedResource>
  };
}

type Refs = Record<string, unknown>;

const agentRefs = (r: Refs): RefField[] => [
  { field: "domainRef", kind: "Domain", ref: r.domainRef as string },
  {
    field: "credentialsRef",
    kind: "Credentials",
    ref: r.credentialsRef as string
  }
];

const trunkRefs = (r: Refs): RefField[] => [
  {
    field: "accessControlListRef",
    kind: "Acl",
    ref: r.accessControlListRef as string
  },
  {
    field: "inboundCredentialsRef",
    kind: "Credentials",
    ref: r.inboundCredentialsRef as string
  },
  {
    field: "outboundCredentialsRef",
    kind: "Credentials",
    ref: r.outboundCredentialsRef as string
  }
];

const domainRefs = (r: Refs): RefField[] => [
  {
    field: "accessControlListRef",
    kind: "Acl",
    ref: r.accessControlListRef as string
  },
  ...((r.egressPolicies as { numberRef?: string }[] | undefined) ?? []).map(
    (p, i): RefField => ({
      field: `egressPolicies[${i}].numberRef`,
      kind: "Number",
      ref: p?.numberRef
    })
  )
];

const numberRefs = (r: Refs): RefField[] => [
  { field: "trunkRef", kind: "Trunk", ref: r.trunkRef as string }
];

/** The reference check for one resource type's requests. */
function refsChecker<R>(
  checkRefs: CheckRefs | undefined,
  refsOf: (request: Refs) => RefField[]
): CheckRequestRefs<R> | undefined {
  return checkRefs
    ? (request, accessKeyId) =>
        checkRefs(accessKeyId, refsOf(request as unknown as Refs))
    : undefined;
}

export {
  agentRefs,
  CheckRefs,
  CheckRequestRefs,
  createCheckRefs,
  createRefLookups,
  domainRefs,
  numberRefs,
  RefField,
  RefKind,
  RefLookups,
  refsChecker,
  trunkRefs
};

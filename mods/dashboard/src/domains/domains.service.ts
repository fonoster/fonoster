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
  Acl,
  CreateDomainRequest,
  Domain,
  INumber,
  UpdateDomainRequest
} from "@fonoster/types";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

const RESOURCE = "domains";

export type EgressRule = { rule: string; numberRef: string };

/** A domain as the screen reads it, whatever shape the SDK handed back. */
export type DomainRow = {
  ref: string;
  name: string;
  domainUri: string;
  accessControlList?: { ref: string; name: string };
  egressPolicies: EgressRule[];
};

/**
 * Nested messages come back from the SDK as raw protobuf objects (it has no
 * mapping for them), so read them through `toObject()` when that's the case.
 */
export function plain<T>(value: unknown): T | undefined {
  if (!value) return undefined;
  const message = value as { toObject?: () => T };
  return typeof message.toObject === "function"
    ? message.toObject()
    : (value as T);
}

export function toDomainRow(domain: Domain): DomainRow {
  const raw = domain as Domain & { egressPoliciesList?: unknown[] };
  const policies = (raw.egressPolicies ??
    raw.egressPoliciesList ??
    []) as unknown[];
  const acl = plain<{ ref: string; name: string }>(raw.accessControlList);
  return {
    ref: domain.ref,
    name: domain.name,
    domainUri: domain.domainUri,
    accessControlList: acl?.ref ? { ref: acl.ref, name: acl.name } : undefined,
    egressPolicies: policies
      .map((policy) => plain<EgressRule>(policy))
      .filter((policy): policy is EgressRule => Boolean(policy?.rule))
  };
}

export function useDomains() {
  const sdk = useSdk();
  // Raw SDK items in the cache (other screens share the "domains" key).
  const list = useResourceList<Domain>(RESOURCE, (request) =>
    sdk.domains.listDomains(request)
  );
  return { ...list, rows: list.items.map(toDomainRow) };
}

export function useCreateDomain() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateDomainRequest) => sdk.domains.createDomain(request),
    { success: "Domain created" }
  );
}

export function useUpdateDomain() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: UpdateDomainRequest) => sdk.domains.updateDomain(request),
    { success: "Domain saved" }
  );
}

export function useDeleteDomain() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.domains.deleteDomain(ref),
    { success: "Domain deleted" }
  );
}

/** ACLs to pick from (first page; same cache as the ACLs screen). */
export function useAclLookup() {
  const sdk = useSdk();
  return useResourceList<Acl>("acls", (request) => sdk.acls.listAcls(request));
}

/** Numbers to pick from (first page; same cache as the Numbers screen). */
export function useNumberLookup() {
  const sdk = useSdk();
  return useResourceList<INumber>("numbers", (request) =>
    sdk.numbers.listNumbers(request)
  );
}

/** "tel:+18095550100" → "+18095550100". */
export function phoneOf(number?: Pick<INumber, "telUrl" | "name">) {
  if (!number) return undefined;
  return number.telUrl?.replace(/^tel:/, "") || number.name;
}

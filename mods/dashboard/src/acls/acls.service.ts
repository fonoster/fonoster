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
import type { Acl, CreateAclRequest } from "@fonoster/types";
import { useMemo } from "react";
import { useSdk } from "~/lib/auth";
import { useResourceList, useResourceMutation } from "~/lib/resource";

const RESOURCE = "acls";

/**
 * The API always pairs the allow list with a deny-everything rule
 * (sipnet/src/acls/createAcl.ts and updateAcl.ts), and the SDK doesn't send
 * `deny` at all. The type still asks for it on update, so we pass the same rule.
 */
const DENY_ALL = ["0.0.0.0/0"];

export function useAcls() {
  const sdk = useSdk();
  return useResourceList<Acl>(RESOURCE, (request) =>
    sdk.acls.listAcls(request)
  );
}

export function useCreateAcl() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: CreateAclRequest) => sdk.acls.createAcl(request),
    { success: "ACL created" }
  );
}

export function useUpdateAcl() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (request: { ref: string; name: string; allow: string[] }) =>
      sdk.acls.updateAcl({ ...request, deny: DENY_ALL }),
    { success: "ACL saved" }
  );
}

export function useDeleteAcl() {
  const sdk = useSdk();
  return useResourceMutation(
    RESOURCE,
    (ref: string) => sdk.acls.deleteAcl(ref),
    { success: "ACL deleted" }
  );
}

/**
 * The list API returns the linked ACL as an object (proto `access_control_list`),
 * while the SDK type declares `accessControlListRef`; accept both.
 */
type Linked = {
  ref: string;
  name: string;
  accessControlListRef?: string;
  accessControlList?: { ref?: string };
};

function aclRefOf(item: Linked) {
  return item.accessControlListRef || item.accessControlList?.ref || undefined;
}

/** "Trunk · Claro" and "Domain · Acme HQ" labels per ACL ref. */
export function useAclUsage() {
  const sdk = useSdk();
  const trunks = useResourceList<Linked>("trunks", (request) =>
    sdk.trunks.listTrunks(request)
  );
  const domains = useResourceList<Linked>("domains", (request) =>
    sdk.domains.listDomains(request)
  );

  const usage = useMemo(() => {
    const map = new Map<string, string[]>();
    const add = (ref: string | undefined, label: string) => {
      if (!ref) return;
      map.set(ref, [...(map.get(ref) ?? []), label]);
    };
    for (const trunk of trunks.items)
      add(aclRefOf(trunk), `Trunk · ${trunk.name}`);
    for (const domain of domains.items)
      add(aclRefOf(domain), `Domain · ${domain.name}`);
    return map;
  }, [trunks.items, domains.items]);

  return {
    usage,
    /** False while loading or when either list failed; show "—" then. */
    ready: trunks.isSuccess && domains.isSuccess
  };
}

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
/*
 * An in-memory SIP network behind GrpcWebMock: numbers, trunks, domains, SIP
 * agents, ACLs, credentials and secrets, created, listed, updated and deleted the
 * way the API does it (refs assigned on create, references resolved to names on
 * read, write-only passwords and secret values). Tests read what the dashboard sent
 * from `api.calls` and what is stored from the public maps.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { GrpcWebMock } from "./grpc-web";

const require = createRequire(import.meta.url);
const sdkDir = dirname(require.resolve("@fonoster/sdk/package.json"));
const pb = (name: string) =>
  require(join(sdkDir, "src/generated/web", `${name}_pb.js`));

/* eslint-disable @typescript-eslint/no-explicit-any */
export const numbersPb: any = pb("numbers");
export const trunksPb: any = pb("trunks");
export const domainsPb: any = pb("domains");
export const agentsPb: any = pb("agents");
export const aclsPb: any = pb("acls");
export const credentialsPb: any = pb("credentials");
export const secretsPb: any = pb("secrets");
/* eslint-enable @typescript-eslint/no-explicit-any */

export type NumberRow = {
  ref: string;
  name: string;
  telUrl: string;
  city: string;
  country: string;
  countryIsoCode: string;
  trunkRef?: string;
  appRef?: string;
  agentAor?: string;
};
export type TrunkUri = {
  host: string;
  port: number;
  transport: string;
  user: string;
  weight: number;
  priority: number;
  enabled: boolean;
};
export type TrunkRow = {
  ref: string;
  name: string;
  inboundUri: string;
  sendRegister: boolean;
  accessControlListRef?: string;
  inboundCredentialsRef?: string;
  outboundCredentialsRef?: string;
  uris: TrunkUri[];
};
export type DomainRow = {
  ref: string;
  name: string;
  domainUri: string;
  accessControlListRef?: string;
  egressPolicies: { rule: string; numberRef: string }[];
};
export type SipAgentRow = {
  ref: string;
  name: string;
  username: string;
  privacy: number;
  enabled: boolean;
  maxContacts: number;
  expires: number;
  domainRef?: string;
  credentialsRef?: string;
};
export type AclRow = { ref: string; name: string; allow: string[] };
export type CredentialsRow = {
  ref: string;
  name: string;
  username: string;
  password: string;
};
export type SecretRow = { ref: string; name: string; secret: string };

const NOW = 1_760_000_000;

/** An empty string means "unset" in the requests, as in the API. */
const opt = (value?: string) => (value ? value : undefined);

export class SipNetwork {
  readonly numbers = new Map<string, NumberRow>();
  readonly trunks = new Map<string, TrunkRow>();
  readonly domains = new Map<string, DomainRow>();
  readonly agents = new Map<string, SipAgentRow>();
  readonly acls = new Map<string, AclRow>();
  readonly credentials = new Map<string, CredentialsRow>();
  readonly secrets = new Map<string, SecretRow>();
  private seq = 0;
  private failures = new Map<string, { code: number; message: string }>();

  /** The next call to `method` (e.g. "Secrets/CreateSecret") fails with this gRPC error. */
  failNext(method: string, code: number, message: string) {
    this.failures.set(method, { code, message });
  }

  private takeFailure(method: string) {
    const failure = this.failures.get(method);
    if (failure) this.failures.delete(method);
    return failure ? { error: failure } : undefined;
  }

  private nextRef(prefix: string) {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  // Seeding helpers: rows with their refs, for tests that start from saved data.
  addTrunk(row: Partial<TrunkRow> & { name: string; inboundUri: string }) {
    const ref = row.ref ?? this.nextRef("tr");
    this.trunks.set(ref, { sendRegister: false, uris: [], ...row, ref });
    return ref;
  }
  addNumber(
    row: Partial<NumberRow> & { name: string; telUrl: string }
  ): string {
    const ref = row.ref ?? this.nextRef("nm");
    this.numbers.set(ref, {
      city: "Santo Domingo",
      country: "Dominican Republic",
      countryIsoCode: "DO",
      ...row,
      ref
    });
    return ref;
  }
  addDomain(row: Partial<DomainRow> & { name: string; domainUri: string }) {
    const ref = row.ref ?? this.nextRef("dm");
    this.domains.set(ref, { egressPolicies: [], ...row, ref });
    return ref;
  }
  addAgent(row: Partial<SipAgentRow> & { name: string; username: string }) {
    const ref = row.ref ?? this.nextRef("ag");
    this.agents.set(ref, {
      privacy: 0,
      enabled: true,
      maxContacts: 1,
      expires: 600,
      ...row,
      ref
    });
    return ref;
  }
  addAcl(row: Partial<AclRow> & { name: string; allow: string[] }) {
    const ref = row.ref ?? this.nextRef("acl");
    this.acls.set(ref, { ...row, ref });
    return ref;
  }
  addCredentials(
    row: Partial<CredentialsRow> & { name: string; username: string }
  ) {
    const ref = row.ref ?? this.nextRef("cr");
    this.credentials.set(ref, { password: "secret", ...row, ref });
    return ref;
  }
  addSecret(row: Partial<SecretRow> & { name: string }) {
    const ref = row.ref ?? this.nextRef("sc");
    this.secrets.set(ref, { secret: "value", ...row, ref });
    return ref;
  }

  // Messages as the API returns them.
  private numberMessage(row: NumberRow) {
    const m = new numbersPb.Number();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setTelUrl(row.telUrl);
    m.setCity(row.city);
    m.setCountry(row.country);
    m.setCountryIsoCode(row.countryIsoCode);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    const trunk = row.trunkRef ? this.trunks.get(row.trunkRef) : undefined;
    if (trunk) {
      const t = new numbersPb.Number.Trunk();
      t.setRef(trunk.ref);
      t.setName(trunk.name);
      m.setTrunk(t);
    }
    if (row.appRef) m.setAppRef(row.appRef);
    else if (row.agentAor) m.setAgentAor(row.agentAor);
    return m;
  }

  private trunkMessage(row: TrunkRow) {
    const m = new trunksPb.Trunk();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setSendRegister(row.sendRegister);
    m.setInboundUri(row.inboundUri);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    const acl = row.accessControlListRef
      ? this.acls.get(row.accessControlListRef)
      : undefined;
    if (acl) {
      const a = new trunksPb.Trunk.Acl();
      a.setRef(acl.ref);
      a.setName(acl.name);
      a.setAllowList(acl.allow);
      a.setDenyList(["0.0.0.0/0"]);
      m.setAccessControlList(a);
    }
    const creds = (ref?: string) => {
      const c = ref ? this.credentials.get(ref) : undefined;
      if (!c) return undefined;
      const out = new trunksPb.Trunk.Credentials();
      out.setRef(c.ref);
      out.setName(c.name);
      out.setUsername(c.username);
      return out;
    };
    const inbound = creds(row.inboundCredentialsRef);
    if (inbound) m.setInboundCredentials(inbound);
    const outbound = creds(row.outboundCredentialsRef);
    if (outbound) m.setOutboundCredentials(outbound);
    m.setUrisList(
      row.uris.map((u) => {
        const uri = new trunksPb.TrunkURI();
        uri.setHost(u.host);
        uri.setPort(u.port);
        uri.setTransport(u.transport);
        uri.setUser(u.user);
        uri.setWeight(u.weight);
        uri.setPriority(u.priority);
        uri.setEnabled(u.enabled);
        return uri;
      })
    );
    return m;
  }

  private domainMessage(row: DomainRow) {
    const m = new domainsPb.Domain();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setDomainUri(row.domainUri);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    const acl = row.accessControlListRef
      ? this.acls.get(row.accessControlListRef)
      : undefined;
    if (acl) {
      const a = new domainsPb.Domain.Acl();
      a.setRef(acl.ref);
      a.setName(acl.name);
      a.setAllowList(acl.allow);
      a.setDenyList(["0.0.0.0/0"]);
      m.setAccessControlList(a);
    }
    m.setEgressPoliciesList(
      row.egressPolicies.map((p) => {
        const e = new domainsPb.EgressPolicy();
        e.setRule(p.rule);
        e.setNumberRef(p.numberRef);
        return e;
      })
    );
    return m;
  }

  private agentMessage(row: SipAgentRow) {
    const m = new agentsPb.Agent();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setUsername(row.username);
    m.setPrivacy(row.privacy);
    m.setEnabled(row.enabled);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    m.setMaxContacts(row.maxContacts);
    m.setExpires(row.expires);
    const domain = row.domainRef ? this.domains.get(row.domainRef) : undefined;
    if (domain) {
      const d = new agentsPb.Agent.Domain();
      d.setRef(domain.ref);
      d.setName(domain.name);
      d.setDomainUri(domain.domainUri);
      m.setDomain(d);
    }
    const creds = row.credentialsRef
      ? this.credentials.get(row.credentialsRef)
      : undefined;
    if (creds) {
      const c = new agentsPb.Agent.Credentials();
      c.setRef(creds.ref);
      c.setName(creds.name);
      c.setUsername(creds.username);
      m.setCredentials(c);
    }
    return m;
  }

  private aclMessage(row: AclRow) {
    const m = new aclsPb.Acl();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setAllowList(row.allow);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    return m;
  }

  private credentialsMessage(row: CredentialsRow) {
    const m = new credentialsPb.Credentials();
    m.setRef(row.ref);
    m.setName(row.name);
    m.setUsername(row.username);
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    return m;
  }

  private secretMessage(row: SecretRow) {
    const m = new secretsPb.Secret();
    m.setRef(row.ref);
    m.setName(row.name);
    // Values are write-only: the API never returns them.
    m.setCreatedAt(NOW);
    m.setUpdatedAt(NOW);
    return m;
  }

  /** Registers List/Get/Create/Update/Delete for every resource on the mock. */
  install(api: GrpcWebMock) {
    this.crud(api, {
      service: "Numbers",
      noun: "Number",
      plural: "Numbers",
      pb: numbersPb,
      rows: this.numbers,
      prefix: "nm",
      message: (row) => this.numberMessage(row),
      create: (r) => ({
        name: r.name,
        telUrl: r.telUrl,
        city: r.city,
        country: r.country,
        countryIsoCode: r.countryIsoCode,
        trunkRef: opt(r.trunkRef),
        appRef: opt(r.appRef),
        agentAor: opt(r.agentAor)
      }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        trunkRef: opt(r.trunkRef) ?? row.trunkRef,
        // The ingress handler is a oneof: setting one clears the other.
        ...(r.appRef || r.agentAor
          ? { appRef: opt(r.appRef), agentAor: opt(r.agentAor) }
          : {})
      })
    });
    this.crud(api, {
      service: "Trunks",
      noun: "Trunk",
      plural: "Trunks",
      pb: trunksPb,
      rows: this.trunks,
      prefix: "tr",
      message: (row) => this.trunkMessage(row),
      create: (r) => ({
        name: r.name,
        inboundUri: r.inboundUri,
        sendRegister: r.sendRegister,
        accessControlListRef: opt(r.accessControlListRef),
        inboundCredentialsRef: opt(r.inboundCredentialsRef),
        outboundCredentialsRef: opt(r.outboundCredentialsRef),
        uris: r.urisList ?? []
      }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        inboundUri: r.inboundUri || row.inboundUri,
        sendRegister: r.sendRegister,
        accessControlListRef: opt(r.accessControlListRef),
        inboundCredentialsRef: opt(r.inboundCredentialsRef),
        outboundCredentialsRef: opt(r.outboundCredentialsRef),
        uris: r.urisList ?? row.uris
      }),
      // Inbound URIs are unique across the install.
      conflict: (r) =>
        [...this.trunks.values()].some(
          (t) => t.inboundUri === r.inboundUri && t.ref !== r.ref
        )
          ? "inbound URI already exists"
          : undefined
    });
    this.crud(api, {
      service: "Domains",
      noun: "Domain",
      plural: "Domains",
      pb: domainsPb,
      rows: this.domains,
      prefix: "dm",
      message: (row) => this.domainMessage(row),
      create: (r) => ({
        name: r.name,
        domainUri: r.domainUri,
        accessControlListRef: opt(r.accessControlListRef),
        egressPolicies: r.egressPoliciesList ?? []
      }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        accessControlListRef: opt(r.accessControlListRef),
        egressPolicies: r.egressPoliciesList ?? row.egressPolicies
      })
    });
    this.crud(api, {
      service: "Agents",
      noun: "Agent",
      plural: "Agents",
      pb: agentsPb,
      rows: this.agents,
      prefix: "ag",
      message: (row) => this.agentMessage(row),
      create: (r) => ({
        name: r.name,
        username: r.username,
        privacy: r.privacy,
        enabled: r.enabled,
        maxContacts: r.maxContacts,
        expires: r.expires,
        domainRef: opt(r.domainRef),
        credentialsRef: opt(r.credentialsRef)
      }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        privacy: r.privacy,
        enabled: r.enabled,
        maxContacts: r.maxContacts || row.maxContacts,
        expires: r.expires || row.expires,
        domainRef: opt(r.domainRef) ?? row.domainRef,
        credentialsRef: opt(r.credentialsRef)
      })
    });
    this.crud(api, {
      service: "Acls",
      noun: "Acl",
      plural: "Acls",
      pb: aclsPb,
      rows: this.acls,
      prefix: "acl",
      message: (row) => this.aclMessage(row),
      create: (r) => ({ name: r.name, allow: r.allowList ?? [] }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        allow: r.allowList?.length ? r.allowList : row.allow
      })
    });
    this.crud(api, {
      service: "CredentialsService",
      noun: "Credentials",
      plural: "Credentials",
      pb: credentialsPb,
      rows: this.credentials,
      prefix: "cr",
      message: (row) => this.credentialsMessage(row),
      create: (r) => ({
        name: r.name,
        username: r.username,
        password: r.password
      }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        username: r.username || row.username,
        password: r.password || row.password
      })
    });
    this.crud(api, {
      service: "Secrets",
      noun: "Secret",
      plural: "Secrets",
      pb: secretsPb,
      rows: this.secrets,
      prefix: "sc",
      message: (row) => this.secretMessage(row),
      create: (r) => ({ name: r.name, secret: r.secret }),
      update: (row, r) => ({
        ...row,
        name: r.name || row.name,
        secret: r.secret || row.secret
      })
    });
    return this;
  }

  private crud<Row extends { ref: string }>(
    api: GrpcWebMock,
    spec: {
      service: string;
      noun: string;
      plural: string;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      pb: any;
      rows: Map<string, Row>;
      prefix: string;
      message: (row: Row) => any;
      create: (request: any) => Omit<Row, "ref">;
      update: (row: Row, request: any) => Row;
      conflict?: (request: any) => string | undefined;
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }
  ) {
    const { service, noun, plural, pb: m, rows } = spec;
    const decode = (name: string, bytes: Uint8Array) =>
      m[name].deserializeBinary(bytes).toObject();
    const notFound = (ref: string) => ({
      error: { code: 5, message: `${noun} ${ref} not found` }
    });

    api.on(`${service}/List${plural}`, () => {
      const response = new m[`List${plural}Response`]();
      response.setItemsList([...rows.values()].map(spec.message));
      response.setNextPageToken("");
      return response;
    });
    api.on(`${service}/Get${noun}`, (bytes) => {
      const { ref } = decode(`Get${noun}Request`, bytes);
      const row = rows.get(ref);
      return row ? spec.message(row) : notFound(ref);
    });
    api.on(`${service}/Create${noun}`, (bytes) => {
      const failed = this.takeFailure(`${service}/Create${noun}`);
      if (failed) return failed;
      const request = decode(`Create${noun}Request`, bytes);
      const conflict = spec.conflict?.(request);
      if (conflict) return { error: { code: 6, message: conflict } };
      const ref = this.nextRef(spec.prefix);
      rows.set(ref, { ...spec.create(request), ref } as Row);
      const response = new m[`Create${noun}Response`]();
      response.setRef(ref);
      return response;
    });
    api.on(`${service}/Update${noun}`, (bytes) => {
      const failed = this.takeFailure(`${service}/Update${noun}`);
      if (failed) return failed;
      const request = decode(`Update${noun}Request`, bytes);
      const row = rows.get(request.ref);
      if (!row) return notFound(request.ref);
      const conflict = spec.conflict?.(request);
      if (conflict) return { error: { code: 6, message: conflict } };
      rows.set(row.ref, spec.update(row, request));
      const response = new m[`Update${noun}Response`]();
      response.setRef(row.ref);
      return response;
    });
    api.on(`${service}/Delete${noun}`, (bytes) => {
      const { ref } = decode(`Delete${noun}Request`, bytes);
      if (!rows.delete(ref)) return notFound(ref);
      const response = new m[`Delete${noun}Response`]();
      response.setRef(ref);
      return response;
    });
  }
}

/** Decodes the last request the dashboard sent to `method`. */
export function lastRequest(
  api: GrpcWebMock,
  method: string,
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  pbModule: any,
  requestType: string
) {
  const calls = api.callsTo(method);
  const last = calls[calls.length - 1];
  if (!last) throw new Error(`no call to ${method}`);
  return pbModule[requestType].deserializeBinary(last.request).toObject();
}

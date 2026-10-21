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

// The workspace resources of the management API (management-api spec), each with a valid create
// request, an update, and requests that must fail validation. `u` is a unique suffix, so runs and
// drivers never collide on names Routr or Postgres keep unique.

type Request = Record<string, unknown>;

type Resource = {
  /** The SDK class (and service) name. */
  api: string;
  /** Singular noun in the method names: createApplication, getApplication... */
  noun: string;
  /** The list method (Credentials lists with listCredentials). */
  list: string;
  create(u: string): Request;
  /** A field the create sets and get returns, to compare. */
  echo: string;
  /** An update and the field it changes; undefined when the resource has no update. */
  update?(ref: string, u: string): Request;
  updated?: string;
  /** False when the resource has no get (API keys are listed, never read one by one). */
  get: boolean;
  /** A create request missing a required field, and that field. */
  missing: { field: string; request(u: string): Request };
  /** A create request with a field in the wrong format, and that field. */
  malformed: { field: string; request(u: string): Request };
};

const digits = (u: string) =>
  String(parseInt(u, 16) % 10_000_000).padStart(7, "0");

const RESOURCES: Resource[] = [
  {
    api: "Applications",
    noun: "Application",
    list: "listApplications",
    create: (u) => ({
      name: `Support ${u}`,
      type: "STREAM",
      url: "wss://apps.example.com/session"
    }),
    echo: "name",
    // UpdateApplication takes the whole app (its type and URL), not a patch.
    update: (ref, u) => ({
      ref,
      name: `Sales ${u}`,
      type: "STREAM",
      url: "wss://apps.example.com/session"
    }),
    updated: "name",
    get: true,
    missing: {
      field: "name",
      request: () => ({ type: "STREAM", url: "wss://apps.example.com/session" })
    },
    malformed: {
      field: "url",
      request: (u) => ({
        name: `Support ${u}`,
        type: "STREAM",
        url: "ws://localhost:3000"
      })
    }
  },
  {
    api: "Secrets",
    noun: "Secret",
    list: "listSecrets",
    create: (u) => ({ name: `deepgram_${u}`, secret: "s3cret-value" }),
    echo: "name",
    update: (ref, u) => ({ ref, name: `openai_${u}`, secret: "other-value" }),
    updated: "name",
    get: true,
    missing: { field: "name", request: () => ({ secret: "s3cret-value" }) },
    malformed: {
      field: "name",
      request: (u) => ({ name: `has space ${u}`, secret: "s3cret-value" })
    }
  },
  {
    api: "Numbers",
    noun: "Number",
    list: "listNumbers",
    create: (u) => ({
      name: `Main line ${u}`,
      telUrl: `tel:+1555${digits(u)}`,
      city: "Austin",
      country: "United States",
      countryIsoCode: "US"
    }),
    echo: "telUrl",
    update: (ref, u) => ({ ref, name: `Front desk ${u}` }),
    updated: "name",
    get: true,
    missing: {
      field: "name",
      request: (u) => ({
        telUrl: `tel:+1556${digits(u)}`,
        city: "Austin",
        country: "United States",
        countryIsoCode: "US"
      })
    },
    malformed: {
      field: "countryIsoCode",
      request: (u) => ({
        name: `Main line ${u}`,
        telUrl: `tel:+1557${digits(u)}`,
        city: "Austin",
        country: "United States",
        countryIsoCode: "XX"
      })
    }
  },
  {
    api: "Trunks",
    noun: "Trunk",
    list: "listTrunks",
    create: (u) => ({
      name: `Carrier ${u}`,
      inboundUri: `t${u}.pstn.fonoster.local`,
      uris: [
        {
          host: "sip.carrier.example.com",
          port: 5060,
          transport: "UDP",
          weight: 1,
          priority: 1
        }
      ]
    }),
    echo: "inboundUri",
    update: (ref, u) => ({ ref, name: `Backup carrier ${u}` }),
    updated: "name",
    get: true,
    missing: {
      field: "name",
      request: (u) => ({
        inboundUri: `m${u}.pstn.fonoster.local`,
        uris: [
          {
            host: "sip.carrier.example.com",
            port: 5060,
            transport: "UDP",
            weight: 1,
            priority: 1
          }
        ]
      })
    },
    malformed: {
      field: "inboundUri",
      request: (u) => ({
        name: `Carrier ${u}`,
        inboundUri: "not a host!",
        uris: [
          {
            host: "sip.carrier.example.com",
            port: 5060,
            transport: "UDP",
            weight: 1,
            priority: 1
          }
        ]
      })
    }
  },
  {
    api: "Agents",
    noun: "Agent",
    list: "listAgents",
    create: (u) => ({ name: `Jane ${u}`, username: `jane${u}` }),
    echo: "username",
    update: (ref, u) => ({ ref, name: `Janet ${u}` }),
    updated: "name",
    get: true,
    missing: { field: "name", request: (u) => ({ username: `john${u}` }) },
    malformed: {
      field: "username",
      request: (u) => ({ name: `Jane ${u}`, username: `Jane Doe ${u}` })
    }
  },
  {
    api: "Credentials",
    noun: "Credentials",
    list: "listCredentials",
    create: (u) => ({
      name: `Office ${u}`,
      username: `office${u}`,
      password: "s3cret-pass"
    }),
    echo: "username",
    update: (ref, u) => ({ ref, name: `Branch ${u}` }),
    updated: "name",
    get: true,
    missing: {
      field: "name",
      request: (u) => ({ username: `branch${u}`, password: "s3cret-pass" })
    },
    malformed: {
      field: "username",
      request: (u) => ({
        name: `Office ${u}`,
        username: `Office ${u}`,
        password: "s3cret-pass"
      })
    }
  },
  {
    api: "Domains",
    noun: "Domain",
    list: "listDomains",
    create: (u) => ({
      name: `Acme ${u}`,
      domainUri: `d${u}.sip.fonoster.local`
    }),
    echo: "domainUri",
    update: (ref, u) => ({ ref, name: `Acme HQ ${u}` }),
    updated: "name",
    get: true,
    missing: {
      field: "name",
      request: (u) => ({ domainUri: `n${u}.sip.fonoster.local` })
    },
    malformed: {
      field: "domainUri",
      request: (u) => ({ name: `Acme ${u}`, domainUri: `nodots${u}` })
    }
  },
  {
    api: "Acls",
    noun: "Acl",
    list: "listAcls",
    create: (u) => ({ name: `Office network ${u}`, allow: ["10.0.0.0/8"] }),
    echo: "name",
    update: (ref, u) => ({
      ref,
      name: `Branch network ${u}`,
      allow: ["192.168.0.0/16"]
    }),
    updated: "name",
    get: true,
    missing: { field: "name", request: () => ({ allow: ["10.0.0.0/8"] }) },
    malformed: {
      field: "allow",
      request: (u) => ({ name: `Office network ${u}`, allow: ["999.1.1.1"] })
    }
  },
  {
    api: "ApiKeys",
    noun: "ApiKey",
    list: "listApiKeys",
    create: () => ({ role: "WORKSPACE_ADMIN" }),
    echo: "role",
    get: false,
    missing: { field: "role", request: () => ({}) },
    malformed: { field: "role", request: () => ({ role: "SUPERUSER" }) }
  }
];

export { RESOURCES, Resource, Request };

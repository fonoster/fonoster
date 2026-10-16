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
/* Sample data for the numbers and trunks tests and stories. */
export const apps = [
  { ref: "ap-7f3c91", name: "Billing reminders", type: "AUTOPILOT" },
  { ref: "ap-2b8e04", name: "Front desk (ES)", type: "AUTOPILOT" },
  { ref: "ap-c4410e", name: "Appointment booking", type: "AUTOPILOT" },
  { ref: "ap-91d0aa", name: "Order status", type: "STREAM" },
  { ref: "ap-55e2f0", name: "Main menu IVR", type: "STREAM" }
];

export const sipAgents = [
  {
    ref: "ag1",
    name: "Maria Lopez",
    username: "maria",
    domain: { ref: "d1", name: "Acme", domainUri: "acme.sip.fonoster.io" }
  },
  {
    ref: "ag2",
    name: "Juan Perez",
    username: "juan",
    domain: { ref: "d1", name: "Acme", domainUri: "acme.sip.fonoster.io" }
  }
];

const location = {
  city: "Santo Domingo",
  country: "Dominican Republic",
  countryIsoCode: "DO"
};

export const trunks = [
  {
    ref: "tk-31a0c2",
    name: "Claro",
    sendRegister: false,
    inboundUri: "claro.acme.sip.fonoster.io",
    accessControlListRef: "acl1",
    outboundCredentialsRef: "cr1",
    uris: [
      {
        host: "sip.claro.com.do",
        port: 5060,
        transport: "UDP",
        user: "acme",
        priority: 1,
        weight: 10,
        enabled: true
      },
      {
        host: "sip2.claro.com.do",
        port: 5060,
        transport: "UDP",
        user: "acme",
        priority: 2,
        weight: 10,
        enabled: true
      }
    ]
  },
  {
    ref: "tk-77d9e1",
    name: "Altice",
    sendRegister: true,
    inboundUri: "altice.acme.sip.fonoster.io",
    inboundCredentialsRef: "cr2",
    uris: [
      {
        host: "pbx.altice.com.do",
        port: 5061,
        transport: "TLS",
        priority: 1,
        weight: 10,
        enabled: true
      }
    ]
  },
  {
    ref: "tk-0b5f48",
    name: "Telnyx EU",
    sendRegister: false,
    inboundUri: "telnyx.acme.sip.fonoster.io",
    // listTrunks returns the nested object rather than the ref.
    accessControlList: { ref: "acl2", name: "Telnyx EU IPs" },
    uris: []
  }
];

export const numbers = [
  {
    ref: "n1",
    name: "Billing outbound",
    telUrl: "tel:+18295550199",
    appRef: "ap-7f3c91",
    trunk: { ref: "tk-31a0c2", name: "Claro" },
    ...location
  },
  {
    ref: "n2",
    name: "Billing inbound",
    telUrl: "tel:+18095550177",
    appRef: "ap-7f3c91",
    trunk: { ref: "tk-77d9e1", name: "Altice" },
    ...location
  },
  {
    ref: "n3",
    name: "Orders",
    telUrl: "tel:+14155550175",
    appRef: "ap-91d0aa",
    trunk: { ref: "tk-31a0c2", name: "Claro" },
    city: "San Francisco",
    country: "United States",
    countryIsoCode: "US"
  },
  {
    ref: "n4",
    name: "Support desk",
    telUrl: "tel:+18095550100",
    agentAor: "sip:maria@acme.sip.fonoster.io",
    trunk: { ref: "tk-31a0c2", name: "Claro" },
    ...location
  },
  {
    ref: "n5",
    name: "Spare",
    telUrl: "tel:+18095550188",
    trunk: { ref: "tk-77d9e1", name: "Altice" },
    ...location
  }
];

export const acls = [
  { ref: "acl1", name: "Claro signaling IPs", allow: ["200.88.0.0/16"] },
  { ref: "acl2", name: "Telnyx EU IPs", allow: ["185.246.0.0/16"] }
];

export const credentials = [
  { ref: "cr1", name: "claro-acme", username: "acme" },
  { ref: "cr2", name: "altice-acme", username: "acme" }
];

type Mock = {
  mockResolvedValue(value: unknown): Mock;
  mockImplementation(fn: (...args: never[]) => unknown): Mock;
};

/**
 * The SDK areas these screens call, as mocks made by `mock` (vi.fn in
 * tests, storybook's fn in stories).
 */
/** us-east-1 as `GET /api/regions/current` returns it, with connection details. */
export const publicRegionWithEndpoints = {
  ref: "us-east-1",
  kind: "public",
  name: "US East (N. Virginia)",
  status: "connected",
  state: "connected",
  secrets: [],
  endpoints: {
    sip: [
      { host: "sip.us-east-1.fonoster.com", port: 5060, transport: "udp" },
      { host: "sip.us-east-1.fonoster.com", port: 5061, transport: "tls" }
    ],
    signalingAddresses: ["198.51.100.1"],
    mediaAddresses: ["198.51.100.2"],
    rtpPorts: { min: 10000, max: 20000 }
  }
};

export function fakeSdk(
  mock: () => Mock,
  data: {
    numbers?: object[];
    trunks?: object[];
  } = {}
) {
  const ok = (value?: unknown) => mock().mockResolvedValue(value);
  const page = (items: object[]) => ok({ items });
  const trunkList = data.trunks ?? trunks;
  const getTrunk = mock().mockImplementation((ref: string) =>
    Promise.resolve(trunkList.find((t) => (t as { ref: string }).ref === ref))
  );
  return {
    numbers: {
      listNumbers: page(data.numbers ?? numbers),
      createNumber: ok({ ref: "n-new" }),
      updateNumber: ok({ ref: "n1" }),
      deleteNumber: ok({ ref: "n1" })
    },
    trunks: {
      listTrunks: page(trunkList),
      getTrunk,
      createTrunk: ok({ ref: "tk-new" }),
      updateTrunk: ok({ ref: "tk-31a0c2" }),
      deleteTrunk: ok({ ref: "tk-31a0c2" })
    },
    applications: { listApplications: page(apps) },
    agents: { listAgents: page(sipAgents) },
    acls: { listAcls: page(acls) },
    credentials: { listCredentials: page(credentials) },
    regions: { getRegion: ok(publicRegionWithEndpoints) }
  };
}

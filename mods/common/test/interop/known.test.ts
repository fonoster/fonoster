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
import * as fs from "fs";
import { BlockList, isIP } from "net";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { knownFarEnds, mergeFarEnds } from "../../src/interop";
import { matchesAddress, matchesHost } from "../../src/interop/farEnds";
import { run } from "../../src/interop/cli";

const FILE = path.join(__dirname, "../../src/interop/far-ends.known.json");
const RAW: Record<string, unknown>[] = JSON.parse(
  fs.readFileSync(FILE, "utf8")
);
const PROVIDERS = [
  "bandwidth",
  "didlogic",
  "plivo",
  "signalwire",
  "telnyx",
  "twilio",
  "voipms",
  "vonage",
  "whatsapp"
];

// Private, loopback and documentation ranges: never a provider's address.
const RESERVED = new BlockList();
[
  ["10.0.0.0", 8],
  ["172.16.0.0", 12],
  ["192.168.0.0", 16],
  ["127.0.0.0", 8],
  ["192.0.2.0", 24],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24]
].forEach(([ip, bits]) =>
  RESERVED.addSubnet(ip as string, bits as number, "ipv4")
);

describe("@common/interop curated far ends", function () {
  it("loads every entry", function () {
    expect(knownFarEnds()).to.have.length(RAW.length);
  });

  it("gives every entry a name, label, hosts or addresses, a source and a checked date", function () {
    const names = RAW.map((e) => e.name as string);
    expect(names).to.deep.equal([...names].sort());
    expect(new Set(names).size).to.equal(names.length);
    names.forEach((n) => expect(PROVIDERS).to.include(n));
    RAW.forEach((e) => {
      expect(e.name, "name").to.match(/^[a-z0-9-]+$/);
      expect(e.label, `${e.name} label`).to.be.a("string").and.not.empty;
      const hosts = (e.hosts as string[] | undefined) ?? [];
      const addresses = (e.addresses as string[] | undefined) ?? [];
      expect(
        hosts.length + addresses.length,
        `${e.name} hosts or addresses`
      ).to.be.above(0);
      const sources = e.sources as string[];
      expect(sources, `${e.name} sources`).to.be.an("array").and.not.empty;
      sources.forEach((s) => expect(s).to.match(/^https:\/\//));
      expect(e.checked, `${e.name} checked`).to.match(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it("lists no private, loopback or documentation address", function () {
    RAW.flatMap((e) => (e.addresses as string[] | undefined) ?? []).forEach(
      (a) => {
        const ip = a.split("/")[0];
        if (isIP(ip) === 4)
          expect(RESERVED.check(ip, "ipv4"), a).to.equal(false);
      }
    );
  });

  it("knows DID Logic by its gateway address inbound and its host outbound", function () {
    const didlogic = knownFarEnds().find((f) => f.name === "didlogic")!;
    // Inbound INVITEs arrive at the Trunk's own host, so only the sender tells.
    expect(matchesAddress(didlogic, "217.69.12.65")).to.equal(true);
    expect(matchesAddress(didlogic, "217.69.12.66")).to.equal(false);
    expect(matchesHost(didlogic, "sip.fr.didlogic.net")).to.equal(true);
    expect(matchesHost(didlogic, "acme.pstn.fonoster.ai")).to.equal(false);
  });

  it("lets --far-ends replace or add entries by name", function () {
    const merged = mergeFarEnds(
      [
        { name: "twilio", hosts: ["*.pstn.twilio.com"] },
        { name: "whatsapp", hosts: ["wa.meta.vc"] }
      ],
      [
        { name: "twilio", hosts: ["sip.example.twilio.test"] },
        { name: "acme", hosts: ["sip.acme.example"] }
      ]
    );
    expect(merged).to.deep.equal([
      { name: "twilio", hosts: ["sip.example.twilio.test"] },
      { name: "whatsapp", hosts: ["wa.meta.vc"] },
      { name: "acme", hosts: ["sip.acme.example"] }
    ]);
  });

  it("classifies with the curated list alone when --far-ends is left out", function () {
    const out: string[] = [];
    const file = path.join(
      __dirname,
      "fixtures/sipjs_wa-dod-invite_whatsapp_20261025.jsonl"
    );
    const code = run(["classify", file], {
      out: (l) => out.push(l),
      err: () => undefined
    });
    expect({ code, out }).to.deep.equal({ code: 0, out: ["whatsapp IOP-004"] });
  });

  it("classifies with an extra far end from --far-ends", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "interop-known-"));
    const extra = path.join(dir, "far-ends.json");
    fs.writeFileSync(
      extra,
      JSON.stringify([{ name: "provider", hosts: ["sip.provider.net"] }])
    );
    const out: string[] = [];
    const file = path.join(
      __dirname,
      "fixtures/seet-agent-1001_rr-1.2.1-dod-declined_provider_20261023.jsonl"
    );
    run(["classify", file, "--far-ends", extra], {
      out: (l) => out.push(l),
      err: () => undefined
    });
    fs.rmSync(dir, { recursive: true, force: true });
    expect(out).to.deep.equal(["provider IOP-008"]);
  });
});

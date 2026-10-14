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
import { join } from "path";
import { loadServiceConfig } from "@fonoster/common";
import { expect } from "chai";
import {
  fonosterConfigSchema,
  MOVED_KEYS,
  SHARED_VALUE_PATHS
} from "../../src/config/schema";

// Values the shipped .env.example provides for ${VAR} references.
const ENV = {
  POSTGRES_USER: "postgres",
  POSTGRES_PASSWORD: "postgres",
  ASTERISK_ARI_USERNAME: "ari",
  ASTERISK_ARI_SECRET: "changeme",
  ASTERISK_SIPPROXY_USERNAME: "voice",
  ASTERISK_SIPPROXY_SECRET: "changeme",
  INFLUXDB_INIT_ORG: "fonoster",
  INFLUXDB_INIT_USERNAME: "influxdb",
  INFLUXDB_INIT_PASSWORD: "changeme",
  INFLUXDB_INIT_TOKEN: "token"
};

const ROOT = join(__dirname, "..", "..", "..", "..");

const load = (file: string) =>
  loadServiceConfig({
    service: "apiserver",
    schema: fonosterConfigSchema,
    argv: ["node", "apiserver", "--config", join(ROOT, "config", file)],
    env: ENV,
    interpolatePaths: SHARED_VALUE_PATHS,
    movedKeys: MOVED_KEYS
  });

describe("@apiserver[config/examples]", function () {
  it("config/fonoster.example.yaml validates", function () {
    const config = load("fonoster.example.yaml");
    expect(config.database.url).to.equal(
      "postgresql://postgres:postgres@postgres:5432/fonoster"
    );
    expect(config.identity.database?.url).to.equal(
      "postgresql://postgres:postgres@postgres:5432/fnidentity"
    );
    expect(config.routr.defaultPeer.username).to.equal("voice");
    expect(config.features.auth.methods).to.deep.equal(["password"]);
  });

  it("config/fonoster.example.jsonc validates and matches the YAML", function () {
    const yaml = load("fonoster.example.yaml");
    const jsonc = load("fonoster.example.jsonc");
    expect(jsonc.database).to.deep.equal(yaml.database);
    expect(jsonc.influxdb).to.deep.equal(yaml.influxdb);
    expect(jsonc.mediaService).to.deep.equal(yaml.mediaService);
  });
});

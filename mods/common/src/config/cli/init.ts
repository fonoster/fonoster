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
import { chmodSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join, relative } from "path";
import {
  envEntries,
  EnvLine,
  expandEnv,
  parseEnvLines,
  serializeEnvLines,
  writeWithMode
} from "./envFile";
import { exposureWarnings } from "./exposure";
import { renderConfigDir, RenderError } from "./render";
import { detectHostIp, ensureKeys, generateSecret } from "./secrets";
import { ensureLocalTls } from "./tls";
import { Io } from "./types";

export type InitOptions = {
  /** The bundle folder (compose.yaml, .env.example, config/). */
  dir: string;
  hostIp?: string;
  /** Finds the host address (tests). */
  detectHostIp?: () => Promise<string | undefined>;
};

/** PUBLIC_URL in .env.example before HTTPS became the default. */
const OLD_DEFAULT_PUBLIC_URL = "http://${HOST_IP}:${HTTP_PORT}";

const HOST = /^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$|^[0-9a-fA-F:]+$/;

/** The .env lines after a run: new values only for missing names or empty secrets. */
function mergeEnv(
  example: EnvLine[],
  existing: EnvLine[] | undefined,
  hostIp: string
): {
  lines: EnvLine[];
  added: string[];
  generated: string[];
  changed: string[];
} {
  const added: string[] = [];
  const changed: string[] = [];
  const generated: string[] = [];
  const valueFor = (name: string, exampleValue: string) => {
    if (name === "HOST_IP") return hostIp;
    if (exampleValue !== "") return exampleValue;
    const secret = generateSecret(name);
    if (secret !== undefined) generated.push(name);
    return secret ?? "";
  };
  const entry = (name: string, value: string): EnvLine => ({
    kind: "entry",
    name,
    value,
    raw: `${name}=${value}`
  });

  if (!existing) {
    const lines = example.map((l) =>
      l.kind === "entry" && (l.value === "" || l.name === "HOST_IP")
        ? entry(l.name, valueFor(l.name, l.value))
        : l
    );
    return { lines, added: [], generated, changed };
  }

  // Existing lines stay as they are, except an empty secret (filled), HOST_IP when --host-ip
  // names another address, and PUBLIC_URL still on the old plain-HTTP default: HTTPS is the
  // default now, so it moves to the example's (https-by-default, Decision 5). An owner-edited
  // PUBLIC_URL is kept; check warns when it is http://.
  const examplePublicUrl = example.find(
    (l): l is Extract<EnvLine, { kind: "entry" }> =>
      l.kind === "entry" && l.name === "PUBLIC_URL"
  )?.value;
  const lines = existing.map((l) => {
    if (l.kind !== "entry") return l;
    if (l.name === "HOST_IP")
      return l.value === hostIp ? l : entry(l.name, hostIp);
    if (
      l.name === "PUBLIC_URL" &&
      l.value === OLD_DEFAULT_PUBLIC_URL &&
      examplePublicUrl &&
      examplePublicUrl !== l.value
    ) {
      changed.push(
        `PUBLIC_URL ${l.value} -> ${examplePublicUrl} (HTTPS is the default now)`
      );
      return entry(l.name, examplePublicUrl);
    }
    if (l.value === "" && generateSecret(l.name) !== undefined)
      return entry(l.name, valueFor(l.name, ""));
    return l;
  });
  const have = envEntries(existing);
  // The documented setup for a TLS proxy in front (HTTP_BIND set, no certificate, no
  // COMPOSE_FILE) keeps serving plain HTTP: it moves to compose.http.yaml.
  if (
    have.get("HTTP_BIND") &&
    !have.has("COMPOSE_FILE") &&
    !have.get("TLS_CERT") &&
    !have.get("TLS_KEY")
  ) {
    lines.push(entry("COMPOSE_FILE", "compose.yaml:compose.http.yaml"));
    changed.push(
      "COMPOSE_FILE=compose.yaml:compose.http.yaml (HTTP_BIND is set: plain HTTP for your TLS proxy, as before)"
    );
  }
  const missing = example.filter(
    (l): l is Extract<EnvLine, { kind: "entry" }> =>
      l.kind === "entry" && !have.has(l.name)
  );
  if (missing.length) {
    lines.push({
      kind: "other",
      raw: `# Added by fonoster-config init (${new Date().toISOString().slice(0, 10)})`
    });
    for (const l of missing) {
      lines.push(entry(l.name, valueFor(l.name, l.value)));
      added.push(l.name);
    }
  }
  return { lines, added, generated, changed };
}

export async function runInit(options: InitOptions, io: Io): Promise<number> {
  const dir = options.dir;
  const exampleFile = join(dir, ".env.example");
  const envFile = join(dir, ".env");
  const configDir = join(dir, "config");
  if (!existsSync(exampleFile) || !existsSync(configDir)) {
    io.err(
      `${dir} has no .env.example or config/: run init in the unpacked fonoster folder, or pass --dir <folder>`
    );
    return 1;
  }
  if (options.hostIp !== undefined && !HOST.test(options.hostIp)) {
    io.err(`--host-ip: "${options.hostIp}" is not an address`);
    return 1;
  }

  const example = parseEnvLines(readFileSync(exampleFile, "utf8"));
  const existing = existsSync(envFile)
    ? parseEnvLines(readFileSync(envFile, "utf8"))
    : undefined;
  const kept = existing ? envEntries(existing).get("HOST_IP") : undefined;
  const hostIp =
    options.hostIp ||
    kept ||
    (await (options.detectHostIp ?? (() => detectHostIp()))());
  if (!hostIp) {
    io.err(
      "could not detect this machine's address: pass --host-ip <address> (the address softphones and browsers reach it at)"
    );
    return 1;
  }

  const { lines, added, generated, changed } = mergeEnv(
    example,
    existing,
    hostIp
  );
  writeWithMode(envFile, serializeEnvLines(lines), 0o600);

  // config/ holds secrets: only the owner may list it. Files inside are readable by the
  // containers, which run as another user and reach them through their bind mounts.
  chmodSync(configDir, 0o700);
  const keys = ensureKeys(configDir);

  // The owner's own settings (platform keys, hand edits) live in config/overrides/<file>.yaml,
  // merged over every render, so running init again or upgrading never resets them.
  const overridesDir = join(configDir, "overrides");
  mkdirSync(overridesDir, { recursive: true, mode: 0o700 });

  const env = expandEnv(envEntries(lines));
  let rendered: string[];
  try {
    rendered = renderConfigDir({
      configDir,
      env,
      overlayDirs: [overridesDir]
    });
  } catch (e) {
    if (!(e instanceof RenderError)) throw e;
    e.problems.forEach((p) => io.err(p));
    io.err("fix .env (or the example) and run init again");
    return 1;
  }

  const rel = (p: string) => relative(dir, p) || ".";
  io.out(
    existing
      ? `.env kept${added.length ? `; added ${added.join(", ")}` : ""}`
      : `.env written (${generated.length} secrets generated)`
  );
  changed.forEach((c) => io.out(`changed: ${c}`));
  const filled = generated.filter((n) => !added.includes(n));
  if (existing && filled.length) io.out(`generated ${filled.join(", ")}`);
  io.out(
    keys.length
      ? `keys: ${keys.length} files created in ${rel(join(configDir, "keys"))}`
      : "keys: kept"
  );
  io.out(`config: ${rendered.map((f) => `config/${f}`).join(", ")}`);
  const tls = ensureLocalTls(dir, env);
  if (tls.state === "owner") io.out("tls: using TLS_CERT and TLS_KEY");
  else
    io.out(
      tls.state === "kept"
        ? `tls: kept (${rel(tls.dir)})`
        : `tls: ${tls.state === "created" ? "local CA and server certificate created" : "server certificate reissued"} in ${rel(tls.dir)} for ${tls.names.join(", ")} (for getting started)`
    );
  io.out(`host address: ${hostIp}`);
  exposureWarnings(env, dir).forEach((w) => io.err(`warning: ${w}`));
  io.out("");
  io.out("Next: docker compose up -d");
  io.out(
    "Then: npx -p @fonoster/common fonoster-config info (dashboard URL and owner login)"
  );
  return 0;
}

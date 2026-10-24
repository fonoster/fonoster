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
import { resolve } from "path";
import { runCheck } from "./check";
import { expandEnv, readEnvFile } from "./envFile";
import { runInfo } from "./info";
import { runInit } from "./init";
import { renderConfigDir, RenderError } from "./render";
import { consoleIo, Io } from "./types";

// fonoster-config: sets up a Fonoster install from the Docker Compose bundle (self-host
// installer). Run it in the unpacked folder: `npx -p @fonoster/common fonoster-config init`.

export const HELP = `Usage: fonoster-config <command> [options]

Sets up Fonoster from its Docker Compose bundle. Run it in the unpacked fonoster folder.

Commands:
  init     Generate secrets and keys, detect the host address, write .env and config/*.yaml.
           Secrets stay in .env; config/*.yaml reference them as \${NAME}. Running it again
           keeps every existing secret and adds only missing ones. Settings in
           config/overrides/<file>.yaml are merged over every render and never reset.
  info     Print the dashboard URL, the owner login, the SIP address and where files live.
  check    Validate config/*.yaml with .env's values (unknown keys, missing values, unset
           \${NAME} placeholders, secret:// references).

Options:
  --dir <folder>        The bundle folder (default: the current folder)
  --host-ip <address>   init: the address softphones and browsers reach this machine at
  -h, --help            Show this help

Then start it with: docker compose up -d
Guide: https://docs.fonoster.com/self-hosting/install-compose
`;

type Parsed = {
  command?: string;
  flags: Record<string, string | true>;
  lists: Record<string, string[]>;
  error?: string;
};

const VALUE_FLAGS = ["dir", "host-ip", "config-dir", "env-file", "overlay"];

export function parseArgs(argv: string[]): Parsed {
  const out: Parsed = { flags: {}, lists: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") out.flags.help = true;
    else if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      const name = eq < 0 ? a.slice(2) : a.slice(2, eq);
      const inline = eq < 0 ? undefined : a.slice(eq + 1);
      if (!VALUE_FLAGS.includes(name))
        return { ...out, error: `unknown option ${a}` };
      const value = inline ?? argv[++i];
      if (value === undefined) return { ...out, error: `${a} needs a value` };
      out.flags[name] = value;
      (out.lists[name] ??= []).push(value);
    } else if (!out.command) out.command = a;
    else return { ...out, error: `unexpected argument ${a}` };
  }
  return out;
}

/**
 * render: the renderer init uses, for other layouts (the development stack): renders the
 * examples in --config-dir (default <dir>/config) with the values of each --env-file (default
 * <dir>/.env; later files win), deep-merging YAML overlays from --overlay.
 */
function runRender(args: Parsed, dir: string, io: Io): number {
  const envFiles = args.lists["env-file"] ?? [resolve(dir, ".env")];
  const entries = new Map<string, string>();
  for (const f of envFiles)
    for (const [k, v] of readEnvFile(resolve(f))) entries.set(k, v);
  const configDir = resolve(
    String(args.flags["config-dir"] ?? `${dir}/config`)
  );
  try {
    const files = renderConfigDir({
      configDir,
      env: expandEnv(entries),
      overlayDirs: (args.lists.overlay ?? []).map((d) => resolve(d))
    });
    io.out(`rendered ${files.join(", ")}`);
    return 0;
  } catch (e) {
    if (!(e instanceof RenderError)) throw e;
    e.problems.forEach((p) => io.err(p));
    return 1;
  }
}

export async function main(
  argv: string[],
  io: Io = consoleIo
): Promise<number> {
  const args = parseArgs(argv);
  if (args.error) {
    io.err(`fonoster-config: ${args.error}`);
    io.err("Run fonoster-config --help for usage.");
    return 2;
  }
  if (args.flags.help || !args.command || args.command === "help") {
    HELP.trimEnd()
      .split("\n")
      .forEach((l) => io.out(l));
    return args.command || args.flags.help ? 0 : 2;
  }
  const dir = resolve(String(args.flags.dir ?? "."));
  switch (args.command) {
    case "init":
      return runInit(
        {
          dir,
          hostIp:
            args.flags["host-ip"] === undefined
              ? undefined
              : String(args.flags["host-ip"])
        },
        io
      );
    case "info":
      return runInfo({ dir }, io);
    case "check":
      return runCheck({ dir }, io);
    case "render":
      return runRender(args, dir, io);
    default:
      io.err(`fonoster-config: unknown command ${args.command}`);
      io.err("Run fonoster-config --help for usage.");
      return 2;
  }
}

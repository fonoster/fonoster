#!/usr/bin/env node
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
import * as path from "path";
import { CellSecrets } from "@fonoster/common";
import { loadAgentConfig, packageVersion } from "./config";
import {
  DirIdentityStore,
  enroll,
  FILES,
  IdentityStore,
  KubeIdentityStore,
  loadIdentity
} from "./enroll";
import { KubeSecrets } from "./kube";
import { runAgent } from "./run";

// fonoster-region: the private region's cell tool (add-private-regions task 3).

const USAGE = `fonoster-region <command>

  enroll <token>            Exchange a one-time enrollment token for this cell's credentials
      --data-dir <dir>        where to keep them (default $FONOSTER_REGION_DATA_DIR or /var/lib/fonoster-region)
      --k8s-secret <name>     keep them in a Kubernetes Secret instead ($FONOSTER_REGION_K8S_SECRET)
      --control-plane <url>   refuse tokens for another control plane
      --nats-creds-path <p>   creds path as the cell's NATS server sees it (default /etc/nats/region/leaf.creds)
      --allow-insecure        accept http:// and nats:// URLs (local testing only)
  run [--config <file>]     Run the region agent (default $FONOSTER_REGION_CONFIG or /etc/fonoster/region-agent.yaml)
  status                    Show this cell's region (never the credentials)
  secrets set <name>        Set a secret; the value is read from stdin (or --from-env <VAR>)
  secrets list              List the names of the secrets set in this cell
  secrets delete <name>     Delete a secret
      --file <f> | --dir <d> | --k8s-secret <name>
                              the store (default $FONOSTER_REGION_SECRETS_FILE, $FONOSTER_REGION_SECRETS_DIR,
                              $FONOSTER_REGION_SECRETS_K8S_SECRET, or <data-dir>/secrets.enc);
                              the file's key is $FONOSTER_REGION_SECRETS_KEY
`;

type Args = { _: string[]; flags: Record<string, string | boolean> };

export function parseArgs(argv: string[]): Args {
  const out: Args = { _: [], flags: {} };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      out._.push(a);
      continue;
    }
    const [k, v] = a.slice(2).split("=", 2);
    if (v !== undefined) out.flags[k] = v;
    else if (["allow-insecure", "help"].includes(k)) out.flags[k] = true;
    else out.flags[k] = argv[++i] ?? "";
  }
  return out;
}

const flag = (a: Args, name: string, env?: string) =>
  (a.flags[name] as string | undefined) ||
  (env ? process.env[env] : undefined) ||
  undefined;

const dataDir = (a: Args) =>
  flag(a, "data-dir", "FONOSTER_REGION_DATA_DIR") ?? "/var/lib/fonoster-region";

function identityStore(a: Args): IdentityStore {
  const secret = flag(a, "k8s-secret", "FONOSTER_REGION_K8S_SECRET");
  return secret
    ? new KubeIdentityStore(new KubeSecrets(), secret)
    : new DirIdentityStore(dataDir(a));
}

/** The secret store a command names: a Kubernetes Secret, a directory or the encrypted file. */
function secretStore(a: Args) {
  const k8s = flag(a, "k8s-secret", "FONOSTER_REGION_SECRETS_K8S_SECRET");
  if (k8s) {
    const kube = new KubeSecrets();
    return {
      names: async () => Object.keys((await kube.get(k8s)) ?? {}).sort(),
      set: (n: string, v: string) => {
        CellSecrets.assertSecretName(n);
        return kube.merge(k8s, { [n]: v });
      },
      delete: async (n: string) => {
        const had = Boolean((await kube.get(k8s))?.[n]);
        if (had) await kube.merge(k8s, { [n]: null });
        return had;
      }
    };
  }
  const dir = flag(a, "dir", "FONOSTER_REGION_SECRETS_DIR");
  const file =
    flag(a, "file", "FONOSTER_REGION_SECRETS_FILE") ??
    path.join(dataDir(a), "secrets.enc");
  const store = CellSecrets.openCellSecrets(dir ? { dir } : { file });
  return {
    names: async () => store.names(),
    set: async (n: string, v: string) => store.set(n, v),
    delete: async (n: string) => store.delete(n)
  };
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) process.stderr.write("value (end with Ctrl-D): ");
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks)
    .toString("utf8")
    .replace(/\r?\n$/, "");
}

export async function main(argv: string[], out = process.stdout) {
  const a = parseArgs(argv);
  const [cmd, sub, arg] = a._;
  const print = (s: string) => out.write(s + "\n");
  if (!cmd || a.flags.help) return print(USAGE);

  if (cmd === "enroll") {
    const token = sub ?? process.env.FONOSTER_REGION_TOKEN;
    if (!token) throw new Error("usage: fonoster-region enroll <token>");
    const store = identityStore(a);
    const identity = await enroll({
      token,
      store,
      version: packageVersion(),
      controlPlane: flag(a, "control-plane"),
      allowInsecure: Boolean(a.flags["allow-insecure"]),
      natsCredsPath: flag(a, "nats-creds-path")
    });
    print(
      `Enrolled region ${identity.regionRef} (workspace ${identity.workspaceRef}).`
    );
    print(`Credentials saved to ${store.where}. Next: start the cell.`);
    return;
  }

  if (cmd === "run") {
    const file =
      flag(a, "config", "FONOSTER_REGION_CONFIG") ??
      "/etc/fonoster/region-agent.yaml";
    const { stop } = await runAgent(loadAgentConfig(file));
    const shutdown = () => void stop().finally(() => process.exit(0));
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    return;
  }

  if (cmd === "status") {
    const identity = await loadIdentity(identityStore(a));
    print(JSON.stringify(identity, null, 2));
    const state = path.join(dataDir(a), "state.json");
    if (fs.existsSync(state)) {
      const s = JSON.parse(fs.readFileSync(state, "utf8"));
      print(
        JSON.stringify(
          {
            configVersion: s.configVersion,
            secretsNeeded: s.secretsNeeded,
            revoked: s.revoked
          },
          null,
          2
        )
      );
    }
    return;
  }

  if (cmd === "secrets") {
    const store = secretStore(a);
    if (sub === "list") {
      const names = await store.names();
      print(names.length ? names.join("\n") : "(no secrets set)");
      return;
    }
    if (sub === "set") {
      if (!arg) throw new Error("usage: fonoster-region secrets set <name>");
      CellSecrets.assertSecretName(arg);
      const fromEnv = flag(a, "from-env");
      const value = fromEnv ? process.env[fromEnv] : await readStdin();
      if (!value) throw new Error("empty value; nothing set");
      await store.set(arg, value);
      print(`Secret ${arg} set (the value stays in this cell).`);
      return;
    }
    if (sub === "delete") {
      if (!arg) throw new Error("usage: fonoster-region secrets delete <name>");
      print(
        (await store.delete(arg))
          ? `Secret ${arg} deleted.`
          : `Secret ${arg} was not set.`
      );
      return;
    }
    throw new Error("usage: fonoster-region secrets set|list|delete");
  }
  throw new Error(`unknown command ${cmd}\n\n${USAGE}`);
}

export { FILES };

// eslint-disable-next-line no-undef
if (require.main === module) {
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write(`fonoster-region: ${(e as Error).message}\n`);
    process.exit(1);
  });
}

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
import { providerDeprecated } from "../webhooks/events";
import { WebhookDispatcher } from "../webhooks/Dispatcher";
import { PrismaWebhookStore } from "../webhooks/prisma";
import {
  openPrismaClient,
  PrismaLike,
  PrismaRegistryStore,
  PrismaUsageSource
} from "./prisma";
import { Registry, RegistryError } from "./Registry";
import { FileRegistryStore } from "./stores";
import { Capability, ItemKind } from "./types";

// fonoster-registry: the operator utility for the provider registry (add-provider-registry P9).
// Two stores (build log P-B3):
// - file (default): the JSON file named by FONOSTER_REGISTRY_FILE (default ./registry.json); no
//   usages are known.
// - database (`--store database` or FONOSTER_REGISTRY_STORE=database): the registry tables of the
//   control-plane database at FONOSTER_REGISTRY_DATABASE_URL (or --database-url). Usages come
//   from apps and assistants; deprecations store workspace notices and, with
//   FONOSTER_REGISTRY_ENCRYPTION_KEY (the apiserver's encryption key, to sign with endpoint
//   secrets), send `provider.deprecated` workspace webhooks.

type Flags = Record<string, string | true>;

function parseArgs(argv: string[]): {
  command: string;
  positional: string[];
  flags: Flags;
} {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Flags = {};
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i++;
      }
    } else positional.push(a);
  }
  return { command, positional, flags };
}

const list = (v: string | true | undefined) =>
  typeof v === "string"
    ? v
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
const str = (v: string | true | undefined, name: string) => {
  if (typeof v !== "string") throw new RegistryError(`--${name} is required`);
  return v;
};

const HELP = `fonoster-registry <command>

  add-provider <id> --adapter <a> --capabilities stt,tts --credential-ref <name>
  add-model <provider/model> --type stt|tts|llm [--features a,b] [--languages en,es] [--settings s]
  add-voice <provider/voice> --models <m1,m2> [--language en] [--gender female]
  deprecate-provider|deprecate-model|deprecate-voice <id> --replacement <id> --retire-on YYYY-MM-DD
  retire-provider|retire-model|retire-voice <id> [--voice-map old=new,...] --yes
  usage <id> | list [provider|model|voice] | show <id> | history [<id>]
  export | plan -f <file> | apply -f <file>

  --store file|database   where the catalog lives (default: FONOSTER_REGISTRY_STORE or file)
  --database-url <url>    with --store database (default: FONOSTER_REGISTRY_DATABASE_URL)`;

const DB_FLAGS = ["store", "database-url"];

/** Runs one command against the JSON file store (synchronous; the default store). */
export function run(
  argv: string[],
  out: (s: string) => void = console.log
): number {
  const { command, positional, flags } = parseArgs(argv);
  for (const f of DB_FLAGS) delete flags[f];
  const registry = new Registry({
    store: new FileRegistryStore(
      process.env.FONOSTER_REGISTRY_FILE ?? "registry.json"
    ),
    testMode: process.env.FONOSTER_TEST_MODE === "true"
  });
  return execute(registry, command, positional, flags, out);
}

export const usesDatabase = (argv: string[]) => {
  const { flags } = parseArgs(argv);
  return (
    (flags.store ?? process.env.FONOSTER_REGISTRY_STORE ?? "file") ===
    "database"
  );
};

/**
 * Runs one command against the control-plane database: loads the catalog and usages, runs the
 * command, then waits for every write, records skipped rewrites in the audit log and sends due
 * `provider.deprecated` webhooks once (retries are adopted by a running dispatcher).
 */
export async function runWithDatabase(
  argv: string[],
  out: (s: string) => void = console.log,
  deps: { prisma?: PrismaLike; actor?: string } = {}
): Promise<number> {
  const { command, positional, flags } = parseArgs(argv);
  for (const f of DB_FLAGS) delete flags[f];
  const url =
    (parseArgs(argv).flags["database-url"] as string | undefined) ??
    process.env.FONOSTER_REGISTRY_DATABASE_URL;
  if (!deps.prisma && !url) {
    out("error: --database-url or FONOSTER_REGISTRY_DATABASE_URL is required");
    return 1;
  }
  const encryptionKey = process.env.FONOSTER_REGISTRY_ENCRYPTION_KEY;
  const prisma = deps.prisma ?? openPrismaClient({ url: url!, encryptionKey });
  try {
    const store = await PrismaRegistryStore.open(prisma);
    const hooks =
      deps.prisma || encryptionKey
        ? await PrismaWebhookStore.open(prisma)
        : undefined;
    const dispatcher = hooks && new WebhookDispatcher({ store: hooks });
    const usages = await PrismaUsageSource.open(prisma, {
      onNotice: (workspace, n) => {
        if (n.type === "provider.deprecated")
          dispatcher?.publish(
            providerDeprecated(workspace, {
              id: String(n.id),
              replacement: String(n.replacement),
              retireOn: String(n.retireOn)
            })
          );
      }
    });
    const registry = new Registry({
      store,
      usages,
      actor: deps.actor,
      testMode: process.env.FONOSTER_TEST_MODE === "true"
    });
    const code = execute(registry, command, positional, flags, out);
    await usages.flush();
    for (const c of usages.conflicts) {
      out(`skipped ${c.usage.config.kind} ${c.usage.config.name}: ${c.reason}`);
      store.audit({
        at: new Date().toISOString(),
        actor: deps.actor ?? process.env.USER ?? "operator",
        action: "rewrite-skipped",
        target: positional[0],
        details: { workspace: c.usage.workspace, config: c.usage.config }
      });
    }
    await store.flush();
    if (dispatcher && hooks) {
      await dispatcher.runDue();
      await hooks.flush();
    } else if (command.startsWith("deprecate-")) {
      out(
        "note: no webhooks sent (set FONOSTER_REGISTRY_ENCRYPTION_KEY); notices were stored"
      );
    }
    return code;
  } finally {
    if (!deps.prisma) await prisma.$disconnect();
  }
}

function execute(
  registry: Registry,
  command: string,
  positional: string[],
  flags: Flags,
  out: (s: string) => void
): number {
  const id = positional[0];
  const printImpact = (
    lines: { mark: string; text: string; count: number }[]
  ) =>
    lines.length
      ? lines.forEach((l) => out(`${l.mark} ${l.text} (${l.count} apps)`))
      : out("no configs use it");
  try {
    switch (command) {
      case "add-provider": {
        const extra = Object.fromEntries(
          Object.entries(flags).map(([k, v]) => [k, v])
        );
        registry.addProvider({
          ...extra,
          id,
          adapter: str(flags.adapter, "adapter"),
          capabilities: list(flags.capabilities) as Capability[],
          credentialRef: str(flags["credential-ref"], "credential-ref")
        });
        break;
      }
      case "add-model":
        registry.addModel({
          id,
          type: str(flags.type, "type") as Capability,
          features: list(flags.features),
          languages: list(flags.languages),
          settings: list(flags.settings)
        });
        break;
      case "add-voice":
        registry.addVoice({
          id,
          models: list(flags.models),
          language: flags.language as string | undefined,
          gender: flags.gender as string | undefined
        });
        break;
      case "deprecate-provider":
      case "deprecate-model":
      case "deprecate-voice":
        printImpact(
          registry.deprecate(
            command.split("-")[1] as ItemKind,
            id,
            str(flags.replacement, "replacement"),
            str(flags["retire-on"], "retire-on")
          ).lines
        );
        break;
      case "retire-provider":
      case "retire-model":
      case "retire-voice": {
        const voiceMap = Object.fromEntries(
          list(flags["voice-map"]).map((p) => p.split("=") as [string, string])
        );
        if (flags.yes !== true) {
          const entry = registry.show(id);
          out(
            `this rewrites every compatible config to ${entry.replacement}; run again with --yes to retire ${id}`
          );
          printImpact(
            registry.impact(id, entry.replacement ?? "", voiceMap).lines
          );
          return 1;
        }
        printImpact(
          registry.retire(command.split("-")[1] as ItemKind, id, voiceMap).lines
        );
        break;
      }
      case "usage": {
        const usages = registry.usage(id);
        if (!usages.length) out("no configs use it");
        for (const u of usages)
          out(`${u.workspace}\t${u.config.kind}\t${u.config.name}`);
        break;
      }
      case "list":
        for (const e of registry.list(positional[0] as ItemKind | undefined))
          out(`${e.kind}\t${e.id}\t${e.state}`);
        break;
      case "show":
        out(JSON.stringify(registry.show(id), null, 2));
        break;
      case "history":
        for (const h of registry.history(id))
          out(`${h.at}\t${h.actor}\t${h.action}\t${h.target}`);
        break;
      case "export":
        out(registry.export().trimEnd());
        break;
      case "plan":
      case "apply": {
        const file = fs.readFileSync(str(flags.f, "f"), "utf8");
        const lines =
          command === "plan" ? registry.plan(file) : registry.apply(file);
        out(lines.length ? lines.join("\n") : "no changes");
        break;
      }
      default:
        out(HELP);
        return command === "help" ? 0 : 1;
    }
    return 0;
  } catch (e) {
    if (e instanceof RegistryError) {
      out(`error: ${e.message}`);
      return 1;
    }
    throw e;
  }
}

// Run when executed as the fonoster-registry binary.
if (require.main === module) {
  const argv = process.argv.slice(2);
  if (usesDatabase(argv))
    runWithDatabase(argv).then(
      (code) => process.exit(code),
      (e) => {
        console.error(`error: ${e.message}`);
        process.exit(1);
      }
    );
  else process.exit(run(argv));
}

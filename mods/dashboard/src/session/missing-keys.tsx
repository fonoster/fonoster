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
/**
 * App warnings for missing provider keys (add-private-regions 4.3). A private region's calls use
 * only the keys set in the region; a public region uses the workspace's own key, else the
 * platform's (the catalog lists only providers with one of those, registry 4.1).
 */
import { Link, useParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { useRegion } from "~/regions/api";
import { regionLink } from "~/regions/links";
import { useSessionQuery } from "./api";
import type { SessionApp } from "./types";

const provider = (id?: string) =>
  id && id.includes("/") ? id.slice(0, id.indexOf("/")) : undefined;

/** Provider ids an app's saved settings name (voice, STT model, Autopilot language model). */
export function providersOf(app: SessionApp): string[] {
  const llm = (app.agent as { languageModel?: { model?: unknown } })
    ?.languageModel?.model;
  const ids = [
    provider(app.speech.voice),
    provider(app.speech.sttModel),
    app.type === "AUTOPILOT" && typeof llm === "string"
      ? provider(llm)
      : undefined
  ].filter((p): p is string => Boolean(p));
  return [...new Set(ids)];
}

export type KeyContext =
  | { kind: "private"; set: string[] }
  | { kind: "public"; usable: string[]; workspaceKeys: string[] };

/** The providers an app needs a key for and has none. */
export function missingKeys(app: SessionApp, ctx: KeyContext): string[] {
  return providersOf(app).filter((p) =>
    ctx.kind === "private"
      ? !ctx.set.includes(p)
      : !ctx.usable.includes(p) && !ctx.workspaceKeys.includes(p)
  );
}

/** The key context of the current workspace, once known; and where keys are fixed. */
function useKeyContext(): { ctx?: KeyContext; fixLink?: string } {
  const { workspaceRef } = useParams();
  const region = useRegion();
  const pub = useSessionQuery(["vendor-keys"], async (api) => ({
    catalog: await api.getCatalog(),
    keys: await api.listVendorKeys()
  }));
  if (region.isPrivate) {
    if (!region.data) return {};
    return {
      ctx: {
        kind: "private",
        set: region.data.secrets.filter((s) => s.set).map((s) => s.name)
      },
      fixLink: regionLink(region.data.ref)
    };
  }
  // Without providers in the catalog nothing is known (or the catalog did not load).
  if (!pub.data?.catalog.providers.length) return {};
  return {
    ctx: {
      kind: "public",
      usable: pub.data.catalog.providers.map((p) => p.id),
      workspaceKeys: pub.data.keys.map((k) => k.providerId)
    },
    fixLink: `/w/${workspaceRef}/vendor-keys`
  };
}

/** One line: which apps need which keys, with a link to add them. */
export function MissingKeysWarning({ apps }: { apps: SessionApp[] }) {
  const { ctx, fixLink } = useKeyContext();
  if (!ctx || !fixLink) return null;
  const missing = apps
    .map((a) => ({ app: a, ids: missingKeys(a, ctx) }))
    .filter((m) => m.ids.length);
  if (!missing.length) return null;
  const text =
    apps.length === 1
      ? `This app needs a key for ${missing[0].ids.join(", ")}.`
      : `Missing keys: ${missing.map((m) => `${m.app.name} (${m.ids.join(", ")})`).join(", ")}.`;
  return (
    <Alert variant="warning">
      {text}{" "}
      <Link to={fixLink} className="underline">
        Add key
      </Link>
    </Alert>
  );
}

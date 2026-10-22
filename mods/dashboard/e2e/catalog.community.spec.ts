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
 * What the provider catalog (Providers/ListCatalog) puts on screen: the agent's pickers and the
 * Vendor keys page. And the Usage page's periods.
 */
import type { Page } from "@playwright/test";
import { FakeApplications } from "./apps";
import { ada, expect, test, tokens } from "./fixtures";
import {
  applications,
  providers,
  struct,
  usage,
  type GrpcWebMock
} from "./grpc-web";

test.use({ variant: "community" });

/** A catalog entry; providers list what they serve and whether they need a key. */
function item(
  id: string,
  kind: "provider" | "model" | "voice",
  label: string,
  options: { type?: string; capabilities?: string[]; keyless?: boolean } = {}
) {
  const i = new providers.CatalogItem();
  i.setId(id);
  i.setKind(kind);
  i.setLabel(label);
  i.setProviderId(id.split("/")[0]);
  if (options.type) i.setType(options.type);
  if (kind === "provider") {
    i.setKeyless(options.keyless ?? false);
    i.setCapabilitiesList(options.capabilities ?? []);
  } else i.setLanguagesList(["en-US"]);
  return i;
}

const FAKES = [
  item("fake", "provider", "Fakes", {
    keyless: true,
    capabilities: ["stt", "tts", "llm"]
  }),
  item("fake/llm", "model", "Fake LLM", { type: "llm" }),
  item("fake/stt", "model", "Fake transcriber", { type: "stt" }),
  item("fake/default", "voice", "Fake voice", { type: "tts" })
];

/** Signs Ada in with these catalog items behind the API (and one Autopilot agent, app-1). */
async function signIn(
  page: Page,
  api: GrpcWebMock,
  catalog: unknown[],
  apps = new FakeApplications()
) {
  apps.install(api);
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Providers/ListCatalog", () => {
      const list = new providers.ListCatalogResponse();
      list.setItemsList(catalog);
      return list;
    });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
}

test("[DSH-058] the language model picker offers no provider the catalog has no model for", async ({
  page,
  api
}) => {
  const product = (productRef: string, config: object) => {
    const container = new applications.ProductContainer();
    container.setProductRef(productRef);
    container.setConfig(struct.Struct.fromJavaScript(config));
    return container;
  };
  const apps = new FakeApplications();
  apps.add("Front desk", "AUTOPILOT", (app) => {
    app.setTextToSpeech(product("tts.fake", { voice: "fake/default" }));
    app.setSpeechToText(
      product("stt.fake", { model: "fake/stt", languageCode: "en-US" })
    );
    app.setIntelligence(
      product("llm.fake", {
        conversationSettings: {
          firstMessage: "Hi, how can I help?",
          systemPrompt: "You are a receptionist.",
          goodbyeMessage: "Bye",
          systemErrorMessage: "Sorry"
        },
        languageModel: {
          provider: "fake",
          model: "fake/llm",
          temperature: 0.4,
          maxTokens: 240,
          tools: []
        }
      })
    );
  });
  await signIn(
    page,
    api,
    [
      ...FAKES,
      // Language-model vendors Autopilot has no model for: listed, with no llm model.
      item("anthropic", "provider", "Anthropic", { capabilities: ["llm"] }),
      item("google", "provider", "Google", { capabilities: ["llm", "tts"] }),
      item("google/en-US-Neural2-F", "voice", "Neural2 F", { type: "tts" })
    ],
    apps
  );
  await page.goto("/w/ws-1/agents/app-1");

  await page.getByRole("button", { name: /^Language model/ }).click();
  await page.getByRole("combobox", { name: "Provider" }).click();
  await expect(page.getByRole("option")).toHaveText(["Fakes"]);
});

test("[DSH-059] Vendor keys offers a noise-cancelling provider by label and lists its key once saved", async ({
  page,
  api
}) => {
  await signIn(page, api, [
    ...FAKES,
    item("deepgram", "provider", "Deepgram", { capabilities: ["stt", "tts"] }),
    item("aicoustics", "provider", "ai-coustics", { capabilities: ["nc"] })
  ]);
  // The workspace's keys, after signIn() installed an empty list.
  const keys: { providerId: string; key: string }[] = [];
  api
    .on("Providers/ListProviderKeys", () => {
      const list = new providers.ListProviderKeysResponse();
      list.setItemsList(
        keys.map((k) => {
          const key = new providers.ProviderKey();
          key.setRef(`pk-${k.providerId}`);
          key.setProviderId(k.providerId);
          key.setCreatedAt(1_760_000_000);
          key.setUpdatedAt(1_760_000_000);
          return key;
        })
      );
      return list;
    })
    .on("Providers/SetProviderKey", (request) => {
      const { providerId, key } =
        providers.SetProviderKeyRequest.deserializeBinary(request).toObject();
      keys.push({ providerId, key });
      const saved = new providers.ProviderKey();
      saved.setRef(`pk-${providerId}`);
      saved.setProviderId(providerId);
      return saved;
    });
  await page.goto("/w/ws-1/vendor-keys");

  // The copy says noise-cancelling accounts can be brought.
  await expect(
    page.getByText(/noise-cancelling accounts/).first()
  ).toBeVisible();
  await page.getByRole("button", { name: "Add key" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByRole("combobox", { name: "Provider" }).click();
  // Keyed providers by label, the noise-cancelling one among them; the keyless fakes take none.
  await expect(page.getByRole("option")).toHaveText([
    "Deepgram",
    "ai-coustics"
  ]);
  await page.getByRole("option", { name: "ai-coustics" }).click();
  await drawer.getByLabel("API key").fill("aic-key-123");
  await drawer.getByRole("button", { name: "Add key" }).click();

  await expect(page.getByText("Key saved for ai-coustics")).toBeVisible();
  expect(keys).toEqual([{ providerId: "aicoustics", key: "aic-key-123" }]);
  // The workspace's own key, listed under its provider's label; the key itself is never shown.
  const row = page
    .getByRole("table", { name: "Vendor keys" })
    .getByRole("row", { name: /ai-coustics/ });
  await expect(row).toContainText("aicoustics");
  await expect(page.getByText("aic-key-123")).toHaveCount(0);
});

test("[DSH-060] Vendor keys with only the keyless fakes shows the platform keys note and no Add key", async ({
  page,
  api
}) => {
  await signIn(page, api, FAKES);
  await page.goto("/w/ws-1/vendor-keys");

  await expect(page.getByText("No vendors configured")).toBeVisible();
  await expect(
    page.getByText(/Calls need at least a text-to-speech vendor/)
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Add platform keys" })
  ).toHaveAttribute("href", /docs\.fonoster\.com\/.*platform-keys/);
  await expect(page.getByRole("button", { name: "Add key" })).toHaveCount(0);
});

test("[DSH-061] Usage shows only the chosen month, and says when a month has no usage", async ({
  page,
  api
}) => {
  const now = new Date();
  const month = (back: number) => {
    const first = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1)
    );
    return {
      fromDay: first.toISOString().slice(0, 10),
      label: first.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      })
    };
  };
  const [current, last, earlier] = [month(0), month(1), month(2)];
  const row = (meter: string, quantity: number, model?: string) => {
    const r = new usage.UsageRow();
    r.setMeter(meter);
    r.setQuantity(quantity);
    r.setOrigin("call");
    if (model) {
      r.setProvider(model.split("/")[0]);
      r.setModel(model);
      r.setKeySource("platform");
    }
    return r;
  };
  const asked: string[] = [];
  api.on("Usage/GetUsage", (request) => {
    const { fromDay } =
      usage.GetUsageRequest.deserializeBinary(request).toObject();
    asked.push(fromDay);
    const response = new usage.GetUsageResponse();
    if (fromDay === current.fromDay)
      response.setRowsList([row("call.seconds", 600)]);
    if (fromDay === last.fromDay)
      response.setRowsList([
        row("call.seconds", 7_200),
        row("stt.seconds", 3_600, "deepgram/nova-3")
      ]);
    return response;
  });
  await signIn(page, api, FAKES);
  await page.goto("/w/ws-1/usage");
  const figure = (label: string) =>
    page.getByText(label, { exact: true }).locator("..");

  // This month: 600 s of calls, no AI usage.
  await expect(figure("Calls")).toContainText("10");
  await expect(page.getByText("deepgram/nova-3")).toHaveCount(0);

  // Last month: its own figures only.
  await page.getByRole("combobox", { name: "Period" }).click();
  await page.getByRole("option", { name: last.label }).click();
  await expect(figure("Calls")).toContainText("120");
  await expect(page.getByText("deepgram/nova-3")).toBeVisible();
  expect(asked).toContain(last.fromDay);

  // A month with nothing: a message instead of zeros.
  await page.getByRole("combobox", { name: "Period" }).click();
  await page.getByRole("option", { name: earlier.label }).click();
  await expect(page.getByText(`No usage in ${earlier.label}.`)).toBeVisible();
  await expect(page.getByText("Calls", { exact: true })).toHaveCount(0);
});

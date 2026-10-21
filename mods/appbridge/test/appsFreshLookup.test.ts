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
import { expect } from "chai";
import { AppBridge } from "../src/AppBridge";
import type { AppStore } from "../src/apps/AppStore";
import type { AppConfig } from "../src/config";

// An agent created a moment ago is not in the cached apps yet: its first call reloads them
// instead of being rejected with 404 until the next background refresh.
describe("@appbridge apps: a just-created app", function () {
  const created: AppConfig = {
    ref: "app-new",
    url: "wss://agent.example/session",
    protocol: "fonoster",
    signingSecret: "s",
    speech: { voice: "fake/default", language: "en-US" }
  };

  function store() {
    let known: AppConfig[] = [];
    const s: AppStore & { refreshes: number } = {
      refreshes: 0,
      find: (ref) => known.find((a) => a.ref === ref),
      forNumber: () => undefined,
      count: () => known.length,
      refresh: async () => {
        s.refreshes += 1;
        known = [created];
      }
    };
    return s;
  }

  const bridge = (apps: AppStore) =>
    new AppBridge({
      config: { nats: { url: "nats://unused:4222" } } as never,
      apps
    }) as unknown as {
      findAppFresh(ref: string): Promise<AppConfig | undefined>;
    };

  it("reloads once when the app isn't cached, and finds it", async function () {
    const apps = store();
    expect(await bridge(apps).findAppFresh("app-new")).to.equal(created);
    expect(apps.refreshes).to.equal(1);
  });

  it("doesn't reload for a cached app", async function () {
    const apps = store();
    await apps.refresh!();
    apps.refreshes = 0;
    expect(await bridge(apps).findAppFresh("app-new")).to.equal(created);
    expect(apps.refreshes).to.equal(0);
  });
});

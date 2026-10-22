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
 * The Talk drawer when a browser call can't happen: no microphone, no secure context, or the
 * server refuses the INVITE. The SIP server is a stand-in on the WebSocket the test token names
 * (page.routeWebSocket); the call that connects is DSH-015, against the platform.
 */
import type { Page } from "@playwright/test";
import { FakeApplications } from "./apps";
import { ada, expect, test, tokens } from "./fixtures";
import { applications, numbers, struct, type GrpcWebMock } from "./grpc-web";

test.use({ variant: "community" });

const SIGNALING = "ws://sip.e2e.test/sip";

/** Signs Ada in with one agent (app-1) and a number linked to it, and opens its Talk drawer. */
async function openTalk(page: Page, api: GrpcWebMock) {
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
          systemErrorMessage: "Sorry",
          idleOptions: {
            message: "Still there?",
            timeout: 10000,
            maxTimeoutCount: 2
          }
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
  apps.install(api);
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Numbers/ListNumbers", () => {
      const number = new numbers.Number();
      number.setRef("num-1");
      number.setName("Main line");
      number.setTelUrl("tel:+15550002222");
      number.setAppRef("app-1");
      const list = new numbers.ListNumbersResponse();
      list.setItemsList([number]);
      return list;
    })
    .on("Applications/CreateTestToken", () => {
      const token = new applications.TestTokenResponse();
      token.setToken("test.token.e2e");
      token.setDomain("default");
      token.setDisplayName("Ada Lovelace");
      token.setSignalingServer(SIGNALING);
      token.setTargetAor("sip:roomr@default");
      token.setUsername("e2e-browser");
      return token;
    });

  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/workspaces$/);
  await page.goto("/w/ws-1/agents/app-1");
  await page.getByRole("button", { name: "Talk to agent" }).click();
  return page.getByRole("dialog");
}

/** The agent's numbers stay listed below the call card. */
async function expectNumbers(drawer: ReturnType<Page["getByRole"]>) {
  const list = drawer.getByRole("region", { name: "Call this number" });
  await expect(list.getByText("Main line")).toBeVisible();
  await expect(list.getByText("+15550002222")).toBeVisible();
}

test("[DSH-051] Talk drawer: a blocked microphone says to allow it and offers Call again", async ({
  page,
  api
}) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
  });
  const drawer = await openTalk(page, api);

  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Call failed")).toBeVisible();
  await expect(
    drawer.getByText(
      "Allow microphone access in your browser to talk to the agent."
    )
  ).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Call again" })
  ).toBeVisible();
  // The microphone is asked first: no token was issued for a call that couldn't start.
  expect(api.callsTo("Applications/CreateTestToken")).toHaveLength(0);
  await expectNumbers(drawer);
});

test("[DSH-052] Talk drawer: over plain HTTP it says calls need HTTPS or localhost, and still lists the numbers", async ({
  page,
  api
}) => {
  // What a browser reports for http:// on an address other than localhost.
  await page.addInitScript(() => {
    Object.defineProperty(window, "isSecureContext", { value: false });
  });
  const drawer = await openTalk(page, api);

  await expect(
    drawer.getByText(/Calls from the browser need HTTPS or localhost/)
  ).toBeVisible();
  await expect(drawer.getByRole("button", { name: /^Call/ })).toHaveCount(0);
  await expectNumbers(drawer);
});

test("[DSH-053] Talk drawer: a rejected INVITE shows Call failed with the status and offers Call again", async ({
  page,
  api
}) => {
  // A microphone that works: a tone from an oscillator.
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext();
      const tone = context.createOscillator();
      const out = context.createMediaStreamDestination();
      tone.connect(out);
      tone.start();
      return out.stream;
    };
  });
  // The call server: refuses every INVITE with 403, as Routr does for a token it rejects.
  const invites: string[] = [];
  await page.routeWebSocket(SIGNALING, (ws) => {
    ws.onMessage((message) => {
      const text = String(message);
      if (!text.startsWith("INVITE ")) return;
      invites.push(text);
      const header = (name: string) =>
        text.match(new RegExp(`^${name}:.*$`, "mi"))?.[0] ?? "";
      ws.send(
        [
          "SIP/2.0 403 Forbidden",
          header("Via"),
          header("From"),
          `${header("To")};tag=e2e`,
          header("Call-ID"),
          header("CSeq"),
          "Content-Length: 0",
          "",
          ""
        ].join("\r\n")
      );
    });
  });
  const drawer = await openTalk(page, api);

  await drawer.getByRole("button", { name: "Call", exact: true }).click();
  await expect(drawer.getByText("Call failed")).toBeVisible({
    timeout: 15_000
  });
  await expect(drawer.getByText(/403 Forbidden/)).toBeVisible();
  await expect(
    drawer.getByRole("button", { name: "Call again" })
  ).toBeVisible();
  // The INVITE named the agent and carried the test token.
  expect(invites).toHaveLength(1);
  expect(invites[0]).toMatch(/^X-App-Ref: app-1\r?$/m);
  expect(invites[0]).toMatch(/^X-Connect-Token: test\.token\.e2e\r?$/m);
  await expectNumbers(drawer);
});

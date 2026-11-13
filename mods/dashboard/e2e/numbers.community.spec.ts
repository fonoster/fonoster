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
import type { Page } from "@playwright/test";
import { ada, expect, test, tokens } from "./fixtures";
import {
  applications,
  calls,
  gate,
  grpcError,
  type GrpcWebMock,
  type StreamStep
} from "./grpc-web";
import { lastRequest, SipNetwork } from "./sipnet";

test.use({ variant: "community" });

const ROUTED = "+1 809 555 0177";
const NOT_ROUTED = "+1 809 555 0188";
const SIP_ROUTED = "+1 809 555 0100";

const FAILED_PRECONDITION = 9;
const RESOURCE_EXHAUSTED = 8;

const Status = calls.TrackCallResponse.Status;
const update = (status: keyof typeof Status, after?: Promise<unknown>) => {
  const message = new calls.TrackCallResponse();
  message.setStatus(Status[status]);
  return { message, after } as StreamStep;
};

async function signIn(page: Page, api: GrpcWebMock) {
  const net = new SipNetwork();
  const trunkRef = net.addTrunk({
    name: "Altice",
    inboundUri: "altice.pstn.fonoster.local"
  });
  net.addNumber({
    name: "Billing inbound",
    telUrl: "tel:+18095550177",
    trunkRef,
    appRef: "app-receptionist"
  });
  net.addNumber({ name: "Spare", telUrl: "tel:+18095550188", trunkRef });
  net.addNumber({
    name: "Support desk",
    telUrl: "tel:+18095550100",
    trunkRef,
    agentAor: "sip:maria@acme.sip.fonoster.local"
  });
  net.install(api);
  api
    .on("Identity/ExchangeCredentials", () => tokens(ada))
    .on("Applications/ListApplications", () => {
      const app = new applications.Application();
      app.setRef("app-receptionist");
      app.setName("Receptionist");
      app.setType(applications.ApplicationType.AUTOPILOT);
      const list = new applications.ListApplicationsResponse();
      list.setItemsList([app]);
      return list;
    });
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(ada.email);
  await page.getByLabel("Password", { exact: true }).fill("pw");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: /Acme Support/ }).click();
  await expect(page).toHaveURL(/\/w\/ws-1$/);
  await page.getByRole("link", { name: "Numbers", exact: true }).click();
  await expect(
    page.getByRole("row", { name: /Billing inbound/ })
  ).toContainText("Receptionist");
}

/** CreateCall answers each call with the next reply; TrackCall streams the next steps. */
function placeCalls(
  api: GrpcWebMock,
  calls_: ({ error: { code: number; message: string } } | StreamStep[])[]
) {
  let n = 0;
  let current: StreamStep[] = [];
  api
    .on("Calls/CreateCall", () => {
      const next = calls_[n++];
      if (!next) throw new Error("no more calls planned");
      if (!Array.isArray(next)) return next;
      current = next;
      const response = new calls.CreateCallResponse();
      response.setRef(`call-${n}`);
      return response;
    })
    .on("Calls/TrackCall", () => ({ stream: current }));
}

async function openTestCall(page: Page, number: string) {
  await page.getByRole("button", { name: `Actions for ${number}` }).click();
  await page.getByRole("menuitem", { name: /Test call/ }).click();
  const drawer = page.getByRole("dialog");
  await expect(drawer).toBeVisible();
  return drawer;
}

test("[DSH-068] a test call from a routed number sends its E.164 and follows the status to the end", async ({
  page,
  api
}) => {
  const ring = gate();
  const answer = gate();
  const hangUp = gate();
  // The answered call ends by closing the stream, with no final status.
  placeCalls(api, [
    [
      update("TRYING"),
      update("PROGRESS", ring.promise),
      update("ANSWER", answer.promise),
      { end: true, after: hangUp.promise }
    ]
  ]);
  await signIn(page, api);

  const drawer = await openTestCall(page, ROUTED);
  await expect(drawer.getByRole("heading", { name: ROUTED })).toBeVisible();
  await expect(
    drawer.getByText("Test call. Receptionist answers the call.")
  ).toBeVisible();
  const field = drawer.getByLabel("Number to call");
  await expect(field).toBeFocused();

  // Not E.164: refused in the drawer, nothing sent.
  await field.fill("555-0100");
  await drawer.getByRole("button", { name: "Call" }).click();
  await expect(
    drawer.getByText("Enter a number to call, e.g. +18095550100")
  ).toBeVisible();
  expect(api.callsTo("Calls/CreateCall")).toHaveLength(0);

  await field.fill("+15551234567");
  await field.press("Enter");
  await expect(drawer.getByText("Calling…", { exact: true })).toBeVisible();
  expect(api.callsTo("Calls/CreateCall")).toHaveLength(1);
  expect(
    lastRequest(api, "Calls/CreateCall", calls, "CreateCallRequest")
  ).toMatchObject({
    from: "+18095550177",
    to: "+15551234567",
    appRef: "app-receptionist"
  });

  // While the call is live: read-only, no button, and the note.
  await expect(field).toHaveAttribute("readonly", "");
  await expect(drawer.getByRole("button", { name: /Call/ })).toHaveCount(0);
  await expect(
    drawer.getByText(
      "Closing this panel doesn't end the call. Hang up the phone to end it."
    )
  ).toBeVisible();

  ring.open();
  await expect(drawer.getByText("Ringing…", { exact: true })).toBeVisible();
  answer.open();
  await expect(drawer.getByText("Answered", { exact: true })).toBeVisible();
  await expect(drawer.getByLabel("Call time")).toHaveText(/^0:0\d$/);
  hangUp.open();
  await expect(drawer.getByText("Call ended", { exact: true })).toBeVisible();
  await expect(drawer.getByLabel("Call time")).toHaveText(/^0:0\d$/);
  await expect(
    drawer.getByRole("button", { name: "Call again" })
  ).toBeVisible();
  await expect(field).not.toHaveAttribute("readonly", "");
  await expect(field).toHaveValue("+15551234567");
  expect(api.callsTo("Calls/CreateCall")).toHaveLength(1);
});

test("[DSH-068] a refused test call says why, and an unanswered one says how it ended", async ({
  page,
  api
}) => {
  placeCalls(api, [
    grpcError(
      FAILED_PRECONDITION,
      "The call was refused: insufficient_balance"
    ),
    grpcError(RESOURCE_EXHAUSTED, "no_capacity"),
    [update("TRYING"), update("BUSY")],
    [update("TRYING"), update("NOANSWER")],
    [update("TRYING"), update("PROGRESS"), update("FAILED")]
  ]);
  await signIn(page, api);
  const drawer = await openTestCall(page, ROUTED);
  const field = drawer.getByLabel("Number to call");
  await field.fill("+15551234567");

  await drawer.getByRole("button", { name: "Call" }).click();
  const alert = drawer.getByRole("alert");
  await expect(alert).toHaveText(
    "Your balance is too low to make calls. Add credit in Billing."
  );
  await expect(alert).toBeFocused();
  expect(api.callsTo("Calls/TrackCall")).toHaveLength(0);
  await expect(field).toHaveValue("+15551234567");

  await drawer.getByRole("button", { name: "Call" }).click();
  await expect(alert).toHaveText(
    "No line is free to place the call. Try again in a minute."
  );
  expect(api.callsTo("Calls/TrackCall")).toHaveLength(0);

  await drawer.getByRole("button", { name: "Call" }).click();
  await expect(drawer.getByText("Busy", { exact: true })).toBeVisible();
  await expect(
    drawer.getByText("The line was busy. Try again later.")
  ).toBeVisible();
  await expect(drawer.getByText("Answered", { exact: true })).toHaveCount(0);

  await drawer.getByRole("button", { name: "Call again" }).click();
  await expect(drawer.getByText("No answer", { exact: true })).toBeVisible();
  await expect(
    drawer.getByText("Nobody answered. Try again, or check the number.")
  ).toBeVisible();

  await drawer.getByRole("button", { name: "Call again" }).click();
  await expect(drawer.getByText("Call failed", { exact: true })).toBeVisible();
  await expect(
    drawer.getByText("The call couldn't be completed. Try again.")
  ).toBeVisible();
  expect(api.callsTo("Calls/CreateCall")).toHaveLength(5);
});

test("[DSH-068] closing the drawer mid-call sends nothing more and returns focus to the row", async ({
  page,
  api
}) => {
  const ring = gate();
  placeCalls(api, [[update("TRYING"), update("PROGRESS", ring.promise)]]);
  await signIn(page, api);
  const drawer = await openTestCall(page, ROUTED);
  await drawer.getByLabel("Number to call").fill("+15551234567");
  await drawer.getByRole("button", { name: "Call" }).click();
  await expect(drawer.getByText("Calling…", { exact: true })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(
    page.getByRole("button", { name: `Actions for ${ROUTED}` })
  ).toBeFocused();
  const sent = api.calls.length;
  ring.open();
  await page.waitForTimeout(300);
  expect(api.calls.slice(sent).map((c) => c.method)).toEqual([]);
});

test("[DSH-068] a number not routed to an Agent or app can't be tested", async ({
  page,
  api
}) => {
  placeCalls(api, []);
  await signIn(page, api);
  for (const number of [SIP_ROUTED, NOT_ROUTED]) {
    await page.getByRole("button", { name: `Actions for ${number}` }).click();
    const item = page.getByRole("menuitem", { name: /Test call/ });
    await expect(item).toHaveAttribute("aria-disabled", "true");
    await expect(item).toContainText(
      "Route this number to an Agent or app to test it"
    );
    await item.click({ force: true });
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.keyboard.press("Escape");
  }
  expect(api.callsTo("Calls/CreateCall")).toHaveLength(0);
});

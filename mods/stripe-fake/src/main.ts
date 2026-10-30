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
/**
 * Runs the Stripe fake (add-stripe-fake): `fonoster-stripe-fake`. Settings from the environment:
 * STRIPE_FAKE_PORT (12111), STRIPE_FAKE_WEBHOOKS ("url|secret,url|secret"), STRIPE_FAKE_VIEWER_DIR,
 * STRIPE_FAKE_PORTAL_URL (the fake's address as browsers reach it; portal links go to Stripe without it).
 */
import { join } from "path";
import { StripeFakeServer } from "./server";

const webhooks = (process.env.STRIPE_FAKE_WEBHOOKS ?? "")
  .split(",")
  .filter(Boolean)
  .map((entry) => {
    const [url, secret] = entry.split("|");
    return { url, secret };
  });

void new StripeFakeServer({
  port: Number(process.env.STRIPE_FAKE_PORT ?? 12111),
  viewerDir:
    process.env.STRIPE_FAKE_VIEWER_DIR ?? join(__dirname, "../viewer/dist"),
  webhooks,
  portalUrl: process.env.STRIPE_FAKE_PORTAL_URL
})
  .start()
  .then((server) =>
    console.log(
      `stripe-fake listening on ${server.url} (viewer at /, control at /_fake)`
    )
  );

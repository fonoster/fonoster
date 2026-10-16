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
// Serve sessions from an existing Express app. The gateway dials ws(s)://<host>/voice.
import { Session, VoiceServer } from "@fonoster/voice";
import express from "express";

const app = express();
app.get("/health", (_req, res) => res.send("ok"));

const server = app.listen(8080);

new VoiceServer({
  path: "/voice",
  signingSecret: process.env.APP_SIGNING_SECRET
}).attach(server, async (session: Session) => {
  await session.say("Hello from Express.");
  await session.hangup();
});

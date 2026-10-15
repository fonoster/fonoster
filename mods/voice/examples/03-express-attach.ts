// Serve sessions from an existing Express app. The gateway dials ws(s)://<host>/voice.
import express from "express";
import { Session, VoiceServer } from "@fonoster/voice/session";

const app = express();
app.get("/health", (_req, res) => res.send("ok"));

const server = app.listen(8080);

new VoiceServer({ path: "/voice", signingSecret: process.env.APP_SIGNING_SECRET }).attach(
  server,
  async (session: Session) => {
    await session.say("Hello from Express.");
    await session.hangup();
  }
);

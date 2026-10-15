// Handlers written for the gRPC SDK keep working: the SDK sees two parameters and passes a
// `res` that forwards to the session. res.dial() is a cold transfer.
import { VoiceServer } from "@fonoster/voice/session";

new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(
  async (req: any, res: any) => {
    await res.answer(); // no-op: the gateway already answered
    await res.say("Connecting you to sales.");
    await res.dial("+15551234567");
  }
);

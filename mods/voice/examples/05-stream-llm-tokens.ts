// Stream LLM tokens straight into speech: one utterance, sent as `speak` pieces sharing an id.
import { Session, VoiceServer } from "@fonoster/voice/session";

async function* reply(question: string): AsyncGenerator<string> {
  // Replace with your model's token stream.
  for (const token of ["You ", "asked ", `"${question}". `, "Here ", "is ", "my ", "answer."])
    yield token;
}

new VoiceServer({ port: 3000, signingSecret: process.env.APP_SIGNING_SECRET }).listen(
  async (session: Session) => {
    await session.say("Ask me anything.");
    const q = await session.gather({ timeout: 6000 });
    if (q.speech) await session.say(reply(q.speech));
    await session.hangup();
  }
);

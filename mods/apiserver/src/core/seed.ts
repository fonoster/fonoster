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
import { getLogger } from "@fonoster/logger";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const logger = getLogger({ service: "apiserver", filePath: __filename });

async function main() {
  await prisma.product.upsert({
    where: { ref: "tts.google" },
    update: {},
    create: {
      ref: "tts.google",
      name: "Google Text-to-Speech",
      vendor: "GOOGLE",
      type: "TTS"
    }
  });

  await prisma.product.upsert({
    where: { ref: "stt.google" },
    update: {},
    create: {
      ref: "stt.google",
      name: "Google Speech-to-Text",
      vendor: "GOOGLE",
      type: "STT"
    }
  });

  await prisma.product.upsert({
    where: { ref: "stt.deepgram" },
    update: {},
    create: {
      ref: "stt.deepgram",
      name: "Deepgram Speech-to-Text",
      vendor: "DEEPGRAM",
      type: "STT"
    }
  });

  await prisma.product.upsert({
    where: { ref: "tts.deepgram" },
    update: {},
    create: {
      ref: "tts.deepgram",
      name: "Deepgram Text-to-Speech",
      vendor: "DEEPGRAM",
      type: "TTS"
    }
  });

  await prisma.product.upsert({
    where: { ref: "tts.elevenlabs" },
    update: {},
    create: {
      ref: "tts.elevenlabs",
      name: "Eleven Labs Text-to-Speech",
      vendor: "ELEVEN_LABS",
      type: "TTS"
    }
  });

  await prisma.product.upsert({
    where: { ref: "tts.azure" },
    update: {},
    create: {
      ref: "tts.azure",
      name: "Azure Text-to-Speech",
      vendor: "MICROSOFT",
      type: "TTS"
    }
  });

  await prisma.product.upsert({
    where: { ref: "llm.openai" },
    update: {},
    create: {
      ref: "llm.openai",
      name: "OpenAI Language Model",
      vendor: "OPENAI",
      type: "LLM"
    }
  });

  await prisma.product.upsert({
    where: { ref: "llm.groq" },
    update: {},
    create: {
      ref: "llm.groq",
      name: "Groq Language Model",
      vendor: "GROQ",
      type: "LLM"
    }
  });

  await prisma.product.upsert({
    where: { ref: "llm.anthropic" },
    update: {},
    create: {
      ref: "llm.anthropic",
      name: "Anthropic Language Model",
      vendor: "ANTHROPIC",
      type: "LLM"
    }
  });

  await prisma.product.upsert({
    where: { ref: "llm.google" },
    update: {},
    create: {
      ref: "llm.google",
      name: "Google Language Model",
      vendor: "GOOGLE",
      type: "LLM"
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    logger.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

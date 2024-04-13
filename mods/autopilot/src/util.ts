/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
 *
 * Licensed under the MIT License (the "License")
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
import GoogleTTS from "@fonoster/googletts";
import PollyTTS from "@fonoster/pollytts";
import AzureTTS from "@fonoster/azuretts";
import { EventsClient } from "./events/emitter";
import { ClientEvent } from "./events/types";
import { TTSVendor } from "./types";
import { nanoid } from "nanoid";

export const getEnvOrDefault = (envName: string, def: number) =>
  process.env[envName] ? parseInt(process.env[envName] || "") : def;

export const getEnvOrBool = (envName: string) =>
  process.env[envName]
    ? (process.env[envName] || "false").toLowerCase() === "true"
    : false;

export const removeEmpty = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeEmpty(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

export const sendClientEvent = (
  eventsClient: EventsClient | null,
  event: ClientEvent
) => {
  if (eventsClient) {
    eventsClient.send(event);
  }
};

export const getTTSPlugin = (params: {
  languageCode: string;
  vendor: TTSVendor;
  path: string;
  secretString: string;
}) => {
  const { path, languageCode, vendor, secretString } = params;

  if (vendor === TTSVendor.AMAZON) {
    const config = JSON.parse(secretString) as {
      tts: {
        credentials: {
          accessKeyId: string;
          secretAccessKey: string;
        };
      };
    };

    return new PollyTTS({
      accessKeyId: config.tts?.credentials?.accessKeyId,
      secretAccessKey: config.tts?.credentials?.secretAccessKey,
      path
    });
  }

  if (vendor === TTSVendor.MICROSOFT) {
    const config = JSON.parse(secretString) as {
      tts: {
        subscriptionKey: string;
        serviceRegion: string;
      };
    };

    return new AzureTTS({
      subscriptionKey: config.tts?.subscriptionKey,
      serviceRegion: config.tts?.serviceRegion,
      path
    });
  }

  // Default to Google
  const credentials = JSON.parse(secretString) as {
    // eslint-disable-next-line camelcase
    private_key: string;
    // eslint-disable-next-line camelcase
    client_email: string;
  };

  return new GoogleTTS({
    credentials: {
      privateKey: credentials.private_key,
      clientEmail: credentials.client_email
    },
    languageCode,
    path
  });
};

export const getVoiceConfig = (params: {
  secretString: string;
  app: {
    speechConfig: {
      voice: string;
      languageCode: string;
    };
  };
  config: {
    defaultLanguageCode: string;
  };
}) => {
  const { secretString, app } = params;

  const speechSecret = JSON.parse(secretString) as {
    tts: {
      voice: string;
      languageCode: string;
      region: string;
      vendor: string;
      cachingFields: string[];
    };
  };

  if ("tts" in speechSecret) {
    const ttsConfig = speechSecret.tts;

    return {
      voice: ttsConfig.voice,
      languageCode: ttsConfig.languageCode,
      region: ttsConfig.region,
      vendor: ttsConfig.vendor as TTSVendor,
      cachingFields: ttsConfig.cachingFields,
      playbackId: nanoid()
    };
  }

  return {
    name: app.speechConfig.voice,
    languageCode:
      app.speechConfig.languageCode || params.config.defaultLanguageCode,
    cachingFields: ["name"],
    playbackId: nanoid(),
    vendor: TTSVendor.GOOGLE
  };
};

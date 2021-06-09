/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import Auth from "@fonos/auth";
import Storage from "@fonos/storage";
import {AttachToEventsRequest, CallRequest} from "./types";
import axios from "axios";
import logger from "@fonos/logger";
import WebSocket from "ws";

const attachToDtmfReceived = (ws, channel) => {
  logger.verbose(`@fonos/dispatcher attaching to dtmf received event`);
  channel.on("ChannelDtmfReceived", (event, channel) => {
    logger.debug(
      `@fonos/dispatcher sending dtmf event [digit: ${event.digit}, channel=${channel.id}]`
    );

    if (ws.readyState !== WebSocket.OPEN) {
      logger.warn(
        `@fonos/dispatcher ignoring socket request on lost connection`
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "DtmfReceived",
        sessionId: channel.id,
        data: event.digit
      })
    );
  });
};

const attachToPlaybackFinished = (ws, client, sessionId) => {
  logger.verbose(`@fonos/dispatcher attaching to playback finished event`);
  client.on("PlaybackFinished", (event, playback) => {
    logger.verbose(
      `@fonos/dispatcher sending playback finished event [playbackId: ${playback.id}]`
    );

    if (ws.readyState !== WebSocket.OPEN) {
      logger.warn(
        `@fonos/dispatcher ignoring socket request on lost connection`
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "PlaybackFinished",
        sessionId,
        data: playback.id
      })
    );
  });
};

const uploadRecording = async (accessKeyId, filename) => {
  logger.verbose(
    `@fonos/dispatcher creating short-life token [accessKeyId=${accessKeyId}]`
  );
  const auth = new Auth();
  const access = await auth.createToken({
    accessKeyId: accessKeyId
  });
  const storage = new Storage({accessKeyId, accessKeySecret: access.token});
  logger.verbose(
    `@fonos/dispatcher uploading file to storage subsystem [filename=${filename}]`
  );

  if (!process.env.RECORDINGS_PATH) {
    throw new Error("environment variable 'RECORDINGS_PATH' is not set");
  }

  await storage.uploadObject({
    // WARNING: Hardcoded value
    bucket: "recordings",
    filename: `${process.env.RECORDINGS_PATH}/${filename}`
  });
};

const attachToRecordingFinished = (ws, client, accessKeyId, sessionId) => {
  logger.verbose(`@fonos/dispatcher attaching to recording finished event`);
  client.on("RecordingFinished", async (event) => {
    logger.debug(
      `@fonos/dispatcher sending recording finished event [filename: ${event.recording.name}]`
    );

    if (ws.readyState !== WebSocket.OPEN) {
      logger.warn(
        `@fonos/dispatcher ignoring socket request on lost connection`
      );
      return;
    }

    ws.send(
      JSON.stringify({
        type: "RecordingFinished",
        sessionId,
        data: {
          name: event.recording.name,
          duration: event.recording.duration,
          format: event.recording.format,
          silenceDuration: event.recording.silence_duration,
          talkingDuration: event.recording.talking_duration
        }
      })
    );

    await uploadRecording(accessKeyId, event.recording.name);
  });
};

const attachToRecordingFailed = (ws, client, sessionId) => {
  logger.verbose(`@fonos/dispatcher attaching to recording failed event `);
  client.on("RecordingFailed", (event) => {
    logger.debug(
      `@fonos/dispatcher sending recording failed event [filename: ${event.recording.name}]`
    );
    ws.send(
      JSON.stringify({
        type: "RecordingFailed",
        sessionId,
        data: {
          cause: event.recording.cause
        }
      })
    );
  });
};

export const attachToEvents = (request: AttachToEventsRequest) => {
  logger.verbose(`@fonos/dispatcher connecting websocket @ mediacontroller`);
  const wsClient = new WebSocket(request.url);

  wsClient.on("open", () => {
    attachToDtmfReceived(wsClient, request.channel);
    attachToPlaybackFinished(wsClient, request.client, request.sessionId);
    attachToRecordingFinished(
      wsClient,
      request.client,
      request.accessKeyId,
      request.sessionId
    );
    attachToRecordingFailed(wsClient, request.client, request.sessionId);
  });

  wsClient.on("close", () => {
    wsClient.terminate();
    logger.verbose(
      `@fonos/dispatcher closing broken connection [sessionId = ${request.sessionId}]`
    );
  });

  wsClient.on("error", () => {
    logger.verbose(
      `@fonos/dispatcher unable to connect to voice app [url = ${request.url}]`
    );
  });
};

export const sendCallRequest = async (url: string, request: CallRequest) => {
  try {
    const response = await axios.post(url, request);
    logger.verbose(
      `@fonos/dispatcher mediacontroller [response = ${
        response.data ? response.data.data : "no response"
      }]`
    );
  } catch (e) {
    logger.error(`Unable to send request to voice app at [url = ${url}]`);
  }
};

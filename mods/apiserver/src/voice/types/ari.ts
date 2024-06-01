/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
enum AriEvent {
  STASIS_START = "StasisStart",
  STASIS_END = "StasisEnd",
  CHANNEL_USER_EVENT = "ChannelUserevent",
  CHANNEL_DTMF_RECEIVED = "ChannelDtmfReceived",
  PLAYBACK_FINISHED = "PlaybackFinished",
  RECORDING_FINISHED = "RecordingFinished",
  RECORDING_FAILED = "RecordingFailed",
  WEB_SOCKET_RECONNECTING = "WebSocketReconnecting",
  WEB_SOCKET_MAX_RETRIES = "WebSocketMaxRetries"
}

enum ChannelVar {
  INGRESS_NUMBER = "INGRESS_NUMBER",
  APP_REF = "APP_REF",
  APP_ENDPOINT = "APP_ENDPOINT",
  METADATA = "METADATA"
}

enum FileFormat {
  SLIN16 = "slin16"
}

type Channel = {
  id: string;
  getChannelVar: (req: {
    channelId: string;
    variable: string;
  }) => Promise<{ value: string }>;
};

type StasisStartEvent = {
  channel: {
    id: string;
    caller: {
      name: string;
      number: string;
    };
  };
};

type PlaybackFinishedEvent = {
  playback: {
    id: string;
  };
};

type ChannelDtmfReceivedEvent = {
  digit: string;
};

type RecordingFinishedEvent = {
  recording: {
    name: string;
    duration: number;
    format: FileFormat;
    silence_duration: number;
    talking_duration: number;
  };
};

type RecordingFailedEvent = {
  recording: {
    // TODO: Enumerate possible causes
    cause: string;
  };
};

type AriClient = {
  on: (
    event: AriEvent,
    callback: (event: StasisStartEvent, channel: Channel) => void
  ) => void;
  start: (appName: string) => void;
  channels?: {
    hangup: (req: { channelId: string }) => void;
    answer: (req: { channelId: string }) => void;
    play: (req: {
      channelId: string;
      media: string;
      playback?: string;
    }) => void;
    mute: (req: { channelId: string; direction: string }) => void;
    unmute: (req: { channelId: string; direction: string }) => void;
  };
};

export {
  AriEvent,
  AriClient,
  ChannelVar,
  Channel,
  FileFormat,
  StasisStartEvent,
  PlaybackFinishedEvent,
  ChannelDtmfReceivedEvent,
  RecordingFinishedEvent,
  RecordingFailedEvent
};

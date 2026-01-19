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
enum AriEvent {
  STASIS_START = "StasisStart",
  STASIS_END = "StasisEnd",
  CHANNEL_USER_EVENT = "ChannelUserevent",
  CHANNEL_DTMF_RECEIVED = "ChannelDtmfReceived",
  PLAYBACK_FINISHED = "PlaybackFinished",
  RECORDING_FINISHED = "RecordingFinished",
  RECORDING_FAILED = "RecordingFailed",
  WEB_SOCKET_RECONNECTING = "WebSocketReconnecting",
  WEB_SOCKET_MAX_RETRIES = "WebSocketMaxRetries",
  CHANNEL_LEFT_BRIDGE = "ChannelLeftBridge",
  DIAL = "Dial"
}

enum ChannelVar {
  CALL_DIRECTION = "CALL_DIRECTION",
  INGRESS_NUMBER = "INGRESS_NUMBER",
  APP_REF = "APP_REF",
  APP_ENDPOINT = "APP_ENDPOINT",
  METADATA = "METADATA",
  FROM_EXTERNAL_MEDIA = "FROM_EXTERNAL_MEDIA",
  CALL_REF = "CALL_REF"
}

export { AriEvent, ChannelVar };

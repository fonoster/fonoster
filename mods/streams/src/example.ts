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
import { AudioSocket, AudioStream, StreamRequest } from ".";

const logger = getLogger({ service: "streams", filePath: __filename });

const PORT = 9092;

const audioSocket = new AudioSocket();

async function connectionHandler(req: StreamRequest, stream: AudioStream) {
  const { ref } = req;
  logger.verbose("new connection", { ref });

  // Do something with the data (e.g. save it to a file, or send it to a transcription service)
  // stream.onData((_data) => { /* save on a file or send to a transcription service */ });

  stream.onClose(() => {
    logger.verbose("stream closed");
  });

  stream.onError((err) => {
    logger.error("stream error", err);
  });

  const filePath = process.cwd() + "/etc/sounds/test.sln";

  logger.verbose("playing sound", { filePath });

  await stream.play(filePath);

  // Hangup the stream after 10 seconds
  setTimeout(async () => {
    logger.verbose("hanging up the stream", { ref });
    stream.hangup();
  }, 10000);
}

audioSocket.listen(PORT, () => {
  logger.info(`audiosocket listening on port ${PORT}`);
});

audioSocket.onConnection(connectionHandler);

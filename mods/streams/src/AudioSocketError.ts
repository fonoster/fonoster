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
import { ErrorCode } from "./types";

class AudioSocketError extends Error {
  constructor(public errorCode: ErrorCode) {
    super(AudioSocketError.getMessageFromCode(errorCode));
    this.name = "AudioSocketError";
  }

  static getMessageFromCode(errorCode: ErrorCode): string {
    switch (errorCode) {
      case ErrorCode.NONE:
        return "No error";
      case ErrorCode.AST_HANGUP:
        return "Asterisk hangup";
      case ErrorCode.AST_FRAME_FORWARDING:
        return "Asterisk frame forwarding";
      case ErrorCode.AST_MEMORY:
        return "Asterisk memory";
      default:
        return "Unknown error";
    }
  }
}

export { AudioSocketError };

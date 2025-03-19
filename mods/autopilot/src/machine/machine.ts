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
import { and } from "xstate";
import { context } from "./context";
import { machineSetup } from "./setup";

const machine = machineSetup.createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgYgB6wBcBDAsAOiOVICcAKAWXQA0B9AZQFE23MB5AORYARAKoAldABU+-AJTY0WANoAGALqJQABwD2sAJYF9O1JpC5EAWgBMAZgCcZWwEYAbAA4A7AFZXAFgd7F08AGhAAT0Rrbz8yFT8PFW8vPxVrV1dbAF8ssMVMMihqMDAjVChsVQ0kEF0DIxMzCwRnd2cnT3tXT1trdxUMttcwyIQg7zJ7Twzo+2drO29PHLyMAv0IABswbDYABQ4OAGEACXZJdDFJKrM6w2NTGub7FU8yd287Tz6-Hu7QiKITzuayTAa2TyeFStTp+awrED5MgbbZ4QgkciUGi0TBCAAyHBY0noHF4Ikk8iRKLANxqdwaj1AzRiKkmyWc9nc9heKlsrm8I0Qzhc7Xmc289msqXi3myuURa2RWx2+GIpAoVDAdFxBKJmBJZIpCkV1KUzmq2j090aT0QDjIHimwL8zjSSUygparUc-k+Cy6IL8fm8CKRBGoRFQ9Qe+nKkh0mGVlXUtytDKadvcsS6vX5WfctgC8U9zldjihwMlpc6nVDis2+kIYFQsag8ZEsC1uwOxzOYi4Ijx1xTdLTDwzCH87nemXsCUCrimfk9fNZ3J8cJ5LtSctWWDIDabLbjOg7XdVGI12J1hOJpPJlPrjdIx7bp871FplujNqZQocsTRCypauK0ELWCWKjuNOKhJNC1hzouoGuHW+4AO5EPc5QAGI6NQbBaCUADGAAWkj6AAtmAOgAK4EN2hynOclzDhatRjr+5hCp4sQ9Euth8pyaT2J63ifGQSxpEGwayrYySoQUGFYVAuH4YRYCkeRVG0fRF7qliWoMMw7A9kxADqWCSHqBoPsa6GYWUKl4QRxFkZR1F0V+7E-oyXEIH4WZOP4879HCQaetE7SfAJmTzK0HzAgpZBaNQOhEXABjlGe1BiGAACONFwPREAmOQsYAG46AA1uQSIpWlGWttluUFUVCAVWlJAPFUXn0uOtpegMcQQrYUELNBBbDICYyuKCkqSgE9i+FMzghvKdWpelsCZVAzX5YVhAMb2zFXL1HG+c0pZcsNXSfKtkp2FNozAu0LyzVKAYSihCKoDoEBwGY+Spj5E42F4ThuF4viLUEzgAqMbixGkAlydECEZJkSVFCUjnA9aF1WN0ZDpFM1i8pKUGDJ6kquGQvydGTO4+HJSXUnj6YDUsoKgW46POEGUK2NT6R05CFNM7Ka17gU4aRj5rbxom2zs-1f5jKyX3xDKCRSm0JautOZPAvynIBd48xJYeL4K++Woq5xzReKybRBEkLiZGJy7Tb47TQbBk1BB87hJUpjmqS5GludpdH2wTLRE6B7izUnaT+P4K7cmQ3wuiTEKut0UsKvuJGRlANFaLHoNkxMs0uHMaQ8d8JYCe0clc2b-KLn4SX1VtO17a1hCVwNq2ykF1ZJ94yNC974N+1BAT8g41jLDkWRAA */
  context,
  id: "fnAI",
  initial: "greeting",
  states: {
    greeting: {
      always: {
        target: "idle",
        description: "Transition to idle after the initial greeting."
      },
      entry: {
        type: "greetUser"
      }
    },

    idle: {
      entry: [{ type: "cleanSpeech" }, { type: "setSpeakingDone" }],
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "Event from VAD system."
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "hangup",
            actions: { type: "goodbye" },
            guard: and(["idleTimeoutCountExceedsMax"])
          },
          {
            target: "transitioningToIdle",
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ]
          }
        ]
      }
    },

    transitioningToIdle: {
      // This intermediate state is necessary to ensure the IDLE_TIMEOUT
      // event is properly reset and retriggered when returning to idle.
      // Without it, the timer would not restart correctly.
      always: {
        target: "idle"
      }
    },

    listeningToUser: {
      entry: [
        { type: "interruptPlayback" },
        { type: "resetIdleTimeoutCount" },
        { type: "setSpeaking" }
      ],
      on: {
        SPEECH_RESULT: {
          target: "waitingForSpeechTimeout",
          actions: {
            type: "appendSpeech"
          },
          description: "Append final speech and process the request.",
          reenter: true
        }
      },
      after: {
        IDLE_TIMEOUT: [
          {
            target: "transitioningToIdle",
            actions: [
              { type: "increaseIdleTimeoutCount" },
              { type: "announceIdleTimeout" }
            ]
          }
        ]
      }
    },

    waitingForSpeechTimeout: {
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "User started speaking again."
        }
      },
      after: {
        MAX_SPEECH_WAIT_TIMEOUT: {
          target: "processingUserRequest",
          description:
            "This will give the person time to breathe and speak again.",
          reenter: true
        }
      }
    },

    hangup: {
      type: "final"
    },

    processingUserRequest: {
      on: {
        SPEECH_START: {
          target: "listeningToUser",
          description: "Event from VAD or similar system.",
          actions: [{ type: "cleanSpeech" }]
        }
      },
      invoke: {
        src: "doProcessUserRequest",
        description: "Process the user request",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "idle"
        }
      }
    }
  },
  after: {
    MAX_SESSION_DURATION: {
      target: ".hangup",
      actions: { type: "goodbye" }
    }
  }
});

export { machine };

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
  /** @xstate-layout N4IgpgJg5mDOIC5QDMB2BBAkgYgB6wBcBDAsAOiOVICcAKAWXQA0B9AZQFE23MB5AORYARAKoAldABU+-AJTY0WANoAGALqJQABwD2sAJYF9O1JpC5EAWgBMAZgCcZWwEYAbAA4A7AFZXAFgd7F08AGhAAT0Rrbz8yFT8PFW8vPxVrV1dbAF8ssMVMMihqMDAjVChsVQ0kEF0DIxMzCwRnd2cnT3tXT1trdxUMttcwyIQg7zJ7Twzo+2drO29PHLyMAv0IABswbDYABQ4OAGEACXZJdDFJKrM6w2NTGub7FU8yd287Tz6-Hu7QiKITzuayTAa2TyeFStTp+awrED5MgbbZ4QgkciUGi0TBCAAyHBY0noHF4Ikk8iRKLANxqdwaj1AzRiKkmyWc9nc9heKlsrm8I0Qzhc7Xmc289msqXi3myuURa2RWx2+GIpAoVDAdFxBKJmBJZIpCkV1KUzmq2j090aT0QDjIHimwL8zjSSUygparUc-k+Cy6IL8fm8CKRBGoRFQ9Qe+nKkh0mGVlXUtytDKadvcsS6vX5WfctgC8U9zldjihwMlpc6nVDis2+kIYFQsag8ZEsC1uwOxzOYi4Ijx1xTdLTDwzCH87nemXsCUCrimfk9fNZ3J8cJ5LtSctWWDIDabLbjOg7XdVGI12J1hOJpPJlPrjdIx7bp871FplujNqZQtL06QrYyRSi80Q+CWKggmQniuhKvLeMK3y7gq+4AO5EPc5QAGI6NQbBaCUADGAAWkj6AAtmAOgAK4EN2hynOclzDhatRjr+5hCp4sQ9Euth8pyaT2J63ifGQSxpEGwaysB7h1uhmFlFAuH4YRYCkeRVG0fRF7qliWoMMw7A9kxADqWCSHqBoPsailYSpeEEcRZGUdRdFfuxP6MlxCB+FmTj+PO-RwkGnrRO0nwCZk8ytB8wIKQUWjUDoRFwAY5RntQYhgAAjjRcD0RAJjkLGABuOgANbkEiyWpelrZZTl+WFQg5WpSQDxVJ59LjraLTWAMTh9L4squiokqiXMMGdCBAzWEByzyrVKVpbAGVQE1eUFYQDG9sxVw9RxPnNMKfJkGd7gxUstjxCJgIIJWEluEGrjQtCi5+Dk8qoDoEBwGY+Spt5E42F4ThuF4vgBNywQlv4cR2HyYl+Dy3whstipFCUynA9aJ1WN0ZDpFMg0OINV0eJ6kquGQvydINO4+MBiVKtsePpv1Sygq4pauNYXTOEGUK2NT6R05CkrxLyzMY3uBThpG3mtvGibs6OIP9S8EldNLwYJFKbQlq606DcC-Kcv5iHwpj+6Hi+KvvlqHN9X+CBeKybRBEkLiZCjom8+8-RQYJtgfPJtsFBhDmqc5GmudpdEu5xp1E7zV19G96QJMuD2BDBUrzIuEKut0cuoQUJGRlANFaMnBMIDYSQOnYHKugtvzWCWAntMB3NW-yn2s3Va0bVtLWEPXE7OGJtiBdWV3eGkAmieD7jB1myPk0tORAA */
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
          description: "User started speaking again.",
          guard: ({ context }) => context.allowUserBargeIn
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
          actions: [{ type: "cleanSpeech" }],
          guard: ({ context }) => context.allowUserBargeIn
        }
      },
      invoke: {
        src: "doProcessUserRequest",
        description: "Process the user request",
        input: ({ context }) => ({ context }),
        onDone: {
          target: "listeningToUser",
          reenter: true,
          actions: [{ type: "cleanSpeech" }]
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

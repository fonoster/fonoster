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
/**
 * A call from the browser to an agent over WebRTC (sip.js), add-talk-in-browser D7. The API
 * issues a short-lived test token; the call goes to the Roomr nodes over SIP on a WebSocket
 * (Envoy's /sip), naming the agent with X-App-Ref.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Web } from "sip.js";
import { useSdk } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";

export type CallStatus =
  | "idle"
  | "connecting"
  | "ringing"
  | "connected"
  | "ended"
  | "failed";

/** Browsers only give pages the microphone on HTTPS or localhost. */
export function canCallFromBrowser() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext === true &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

function micError(cause: unknown) {
  const name = (cause as { name?: string })?.name;
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Allow microphone access in your browser to talk to the agent.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No microphone found. Connect one and try again.";
  return undefined;
}

export function useBrowserCall(appRef: string) {
  const sdk = useSdk();
  const audioRef = useRef<HTMLAudioElement>(null);
  const userRef = useRef<Web.SimpleUser | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string>();
  const [connectedAt, setConnectedAt] = useState<number>();
  const [muted, setMuted] = useState(false);

  const teardown = useCallback(async () => {
    const user = userRef.current;
    userRef.current = null;
    if (user) {
      await user.hangup().catch(() => {});
      await user.disconnect().catch(() => {});
    }
    const audio = audioRef.current;
    if (audio) {
      const stream = audio.srcObject as MediaStream | null;
      audio.pause?.();
      audio.srcObject = null;
      stream?.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const fail = useCallback(
    async (message: string) => {
      setError(message);
      setStatus("failed");
      await teardown();
    },
    [teardown]
  );

  const start = useCallback(async () => {
    setError(undefined);
    setConnectedAt(undefined);
    setMuted(false);
    setStatus("connecting");
    try {
      // Ask for the microphone first, so a refusal gets its own message.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((track) => track.stop());
    } catch (cause) {
      await fail(micError(cause) ?? "Couldn't open the microphone.");
      return;
    }
    try {
      const token = await sdk.applications.createTestToken();
      const { username, domain, displayName, signalingServer, targetAor } =
        token;

      const user = new Web.SimpleUser(signalingServer, {
        aor: `sip:${username}@${domain}`,
        delegate: {
          onCallAnswered: () => {
            setConnectedAt(Date.now());
            setStatus("connected");
          },
          onCallHangup: () => {
            setStatus((current) => (current === "failed" ? current : "ended"));
            void teardown();
          },
          onServerDisconnect: (cause) => {
            if (cause && userRef.current)
              void fail("Lost the connection to the call server.");
          }
        },
        media: {
          constraints: { audio: true, video: false },
          remote: { audio: audioRef.current ?? undefined }
        },
        userAgentOptions: {
          displayName,
          transportOptions: { server: signalingServer, keepAliveInterval: 15 }
        }
      });
      userRef.current = user;

      try {
        // A blocked or unanswered WebSocket may never settle connect(): give up after 10 s.
        await Promise.race([
          user.connect(),
          new Promise((_, reject) =>
            window.setTimeout(() => reject(new Error("timeout")), 10_000)
          )
        ]);
      } catch {
        await fail("Couldn't reach the call server. Try again.");
        return;
      }
      await user.call(
        targetAor,
        {
          extraHeaders: [
            `X-App-Ref: ${appRef}`,
            `X-Connect-Token: ${token.token}`
          ]
        },
        {
          requestDelegate: {
            onProgress: (response) => {
              const code = response.message.statusCode ?? 0;
              if (code === 180 || code === 183)
                setStatus((current) =>
                  current === "connecting" ? "ringing" : current
                );
            },
            onReject: (response) => {
              const { statusCode, reasonPhrase } = response.message;
              void fail(
                `The call was rejected (${statusCode} ${reasonPhrase}).`
              );
            }
          }
        }
      );
    } catch (cause) {
      await fail(
        micError(cause) ??
          errorMessage(cause, "Couldn't start the call. Try again.")
      );
    }
  }, [sdk, appRef, teardown, fail]);

  const end = useCallback(async () => {
    setStatus("ended");
    await teardown();
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const user = userRef.current;
    if (!user) return;
    if (user.isMuted()) user.unmute();
    else user.mute();
    setMuted(user.isMuted());
  }, []);

  // Hang up when the drawer closes or the page changes.
  useEffect(() => () => void teardown(), [teardown]);

  return {
    audioRef,
    status,
    error,
    connectedAt,
    muted,
    start,
    end,
    toggleMute
  };
}

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
 * A test call from the browser to an agent over WebRTC (sip.js), ported from
 * the previous dashboard's use-sip / use-test-call hooks. The API issues a
 * short-lived test token; the agent ref travels in an X-App-Ref header.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Web } from "sip.js";
import { useSdk } from "~/lib/auth";
import { errorMessage } from "~/lib/errors";
import { useWorkspace } from "~/lib/workspace";

export type CallStatus =
  | "idle"
  | "dialing"
  | "ringing"
  | "connected"
  | "ended"
  | "failed";

export function useBrowserCall(appRef: string) {
  const sdk = useSdk();
  const workspace = useWorkspace();
  const audioRef = useRef<HTMLAudioElement>(null);
  const userRef = useRef<Web.SimpleUser | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [error, setError] = useState<string>();
  const [connectedAt, setConnectedAt] = useState<number>();

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
      audio.pause();
      audio.srcObject = null;
      stream?.getTracks().forEach((track) => track.stop());
    }
  }, []);

  const start = useCallback(async () => {
    setError(undefined);
    setConnectedAt(undefined);
    setStatus("dialing");
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
            if (cause) {
              setError("Lost the connection to the call server.");
              setStatus("failed");
            }
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

      await user.connect();
      await user.call(
        targetAor,
        {
          extraHeaders: [
            `X-App-Ref: ${appRef}`,
            `X-Connect-Token: ${token.token}`,
            `X-Access-Key-Id: ${workspace.accessKeyId}`
          ]
        },
        {
          requestDelegate: {
            onProgress: (response) => {
              const code = response.message.statusCode ?? 0;
              if (code === 180 || code === 183)
                setStatus((current) =>
                  current === "dialing" ? "ringing" : current
                );
            },
            onReject: (response) => {
              setError(
                `The call was rejected (${response.message.statusCode} ${response.message.reasonPhrase}).`
              );
              setStatus("failed");
            }
          }
        }
      );
    } catch (cause) {
      const denied = (cause as { name?: string })?.name === "NotAllowedError";
      setError(
        denied
          ? "Allow microphone access in your browser to talk to the agent."
          : errorMessage(cause, "Couldn't start the call. Try again.")
      );
      setStatus("failed");
      await teardown();
    }
  }, [sdk, appRef, workspace.accessKeyId, teardown]);

  const end = useCallback(async () => {
    setStatus("ended");
    await teardown();
  }, [teardown]);

  // Hang up when the drawer closes or the page changes.
  useEffect(() => () => void teardown(), [teardown]);

  return { audioRef, status, error, connectedAt, start, end };
}

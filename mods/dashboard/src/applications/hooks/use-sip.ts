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

import { useCallback, useRef, useState, useEffect } from "react";
import { Web } from "sip.js";
import { TEST_PHONE_CONFIG } from "~/core/sdk/stores/fonoster.config";
import { Logger } from "~/core/shared/logger";

/**
 * useSipTestCall
 *
 * @description
 * Hook to manage a SIP-based test call using SIP.js and a preconfigured test agent.
 * Handles the SIP session lifecycle including connection, call control, and audio output.
 *
 * @returns
 * - `audioRef`: Ref to the audio element for media playback
 * - `state`: Connection and call status
 * - `connect()`: Initiates SIP session
 * - `call(appRef)`: Starts or ends the test call with optional app metadata
 * - `close()`: Gracefully tears down the SIP session
 *
 * @example
 * ```ts
 * const {
 *   audioRef,
 *   state: { isConnected, isCalling },
 *   connect,
 *   call,
 *   close,
 * } = useSipTestCall()
 * ```
 */
export function useSipTestCall() {
  /** Ref to the audio element for remote media playback */
  const audioRef = useRef<HTMLAudioElement>(null);

  /** Tracks whether SIP is connected to the server */
  const [isConnected, setIsConnected] = useState(false);

  /** Tracks whether there is an active call */
  const [isCalling, setIsCalling] = useState(false);

  /** Tracks whether the call has been answered */
  const [isAnswered, setIsAnswered] = useState(false);

  /** Holds the active SIP session */
  const [simpleUser, setSimpleUser] = useState<Web.SimpleUser | null>(null);

  /** Ref to track current simpleUser for cleanup */
  const simpleUserRef = useRef<Web.SimpleUser | null>(null);

  /** Keep ref in sync with state */
  useEffect(() => {
    simpleUserRef.current = simpleUser;
  }, [simpleUser]);

  /**
   * connect
   *
   * @description
   * Initializes and connects a SimpleUser instance to the SIP server.
   * Sets up media streams and connection delegates.
   */
  const connect = useCallback(async () => {
    Logger.debug("[useTestCall] Connecting to SIP server...");

    const currentUser = simpleUserRef.current;
    if (currentUser) {
      await currentUser.disconnect();
      setSimpleUser(null);
      simpleUserRef.current = null;
    }

    const delegate: Web.SimpleUserDelegate = {
      onCallAnswered: () => {
        setIsCalling(false);
        setIsAnswered(true);
      },
      onCallHangup: () => {
        setIsCalling(false);
        setIsAnswered(false);
      },
      onServerConnect: () => setIsConnected(true),
      onServerDisconnect: () => {
        Logger.debug("[useTestCall] Disconnected from SIP server");
        setIsConnected(false);
        setIsCalling(false);
        setIsAnswered(false);
      }
    };

    const options: Web.SimpleUserOptions = {
      aor: `sip:${TEST_PHONE_CONFIG.username}@${TEST_PHONE_CONFIG.domain}`,
      delegate,
      media: {
        constraints: { audio: true, video: false },
        remote: { audio: audioRef.current! }
      },
      userAgentOptions: {
        displayName: TEST_PHONE_CONFIG.displayName,
        authorizationUsername: TEST_PHONE_CONFIG.authorizationUser,
        authorizationPassword: TEST_PHONE_CONFIG.password,
        allowLegacyNotifications: false,
        transportOptions: {
          server: TEST_PHONE_CONFIG.server,
          keepAliveInterval: 15
        }
      }
    };

    const user = new Web.SimpleUser(TEST_PHONE_CONFIG.server, options);

    try {
      await user.connect();
      setSimpleUser(user);
      simpleUserRef.current = user;
    } catch (error) {
      Logger.error("[useTestCall] Failed to connect to SIP server", error);
      setIsConnected(false);
      setIsCalling(false);
    }
  }, []);

  /**
   * call
   *
   * @description
   * Initiates or ends a SIP test call.
   * Sends the application reference as a SIP header for context.
   *
   * @param appRef - Application reference to be passed via SIP header
   */
  const call = useCallback(
    async (appRef: string) => {
      const user = simpleUserRef.current;
      if (!user) return;

      try {
        if (!isCalling) {
          setIsCalling(true);
          setIsAnswered(false);
          await user.call(TEST_PHONE_CONFIG.targetAOR, {
            extraHeaders: [`X-App-Ref: ${appRef}`]
          });
        } else {
          await user.hangup();
        }
      } catch (error) {
        Logger.error("[useTestCall] Call error", error);
        setIsCalling(false);
        setIsAnswered(false);
      }
    },
    [isCalling]
  );

  /**
   * close
   *
   * @description
   * Tears down the SIP session and resets all state.
   * Also ensures media streams are stopped and cleaned up.
   */
  const close = useCallback(() => {
    Logger.debug("[useTestCall] Closing SIP session");

    const shutdown = async () => {
      try {
        const user = simpleUserRef.current;
        if (user) {
          await user.hangup().catch(() => {});
          await user.disconnect().catch(() => {});
          setSimpleUser(null);
          simpleUserRef.current = null;
        }
      } finally {
        setIsConnected(false);
        setIsCalling(false);
        setIsAnswered(false);

        if (audioRef.current) {
          const stream = audioRef.current.srcObject as MediaStream | null;
          audioRef.current.pause();
          audioRef.current.srcObject = null;
          stream?.getTracks().forEach((track) => track.stop());
        }
      }
    };

    shutdown();
  }, []);

  return {
    audioRef,
    state: {
      isConnected,
      isCalling,
      isAnswered
    },
    connect,
    call,
    close
  };
}

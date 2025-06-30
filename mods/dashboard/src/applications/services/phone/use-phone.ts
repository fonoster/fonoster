import { useCallback, useRef, useState } from "react";
import { Web } from "sip.js";
import { TEST_PHONE_CONFIG } from "~/core/sdk/stores/fonoster.config";
import { Logger } from "~/core/shared/logger";

/**
 * useTestCall
 *
 * @description
 * Hook to manage a SIP-based test call using SIP.js.
 * Encapsulates connection lifecycle, registration, and audio call controls.
 *
 * Usage:
 * ```ts
 * const {
 *   audioRef,
 *   state: { isConnected, isRegistered, isCalling },
 *   connect,
 *   register,
 *   call,
 *   close
 * } = useTestCall()
 * ```
 */
export function useTestCall() {
  /** Audio output element reference for the remote media stream. */
  const audioRef = useRef<HTMLAudioElement>(null);

  /** SIP call connection state. */
  const [isConnected, setIsConnected] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  /** Internal reference to the active SIP user agent. */
  const [simpleUser, setSimpleUser] = useState<Web.SimpleUser | null>(null);

  /**
   * connect
   *
   * @description
   * Initializes and connects a new SimpleUser to the SIP server.
   * Replaces any existing session before starting a new one.
   *
   * @param appRef - Application reference sent as a SIP header
   */
  const connect = useCallback(
    async (appRef: string) => {
      Logger.debug("[useTestCall] Connecting to SIP server...");

      // Cleanup any previous user session
      if (simpleUser) {
        await simpleUser.unregister();
        await simpleUser.disconnect();
        setSimpleUser(null);
      }

      const delegate: Web.SimpleUserDelegate = {
        onCallAnswered: () => setIsCalling(true),
        onCallHangup: () => setIsCalling(false),
        onRegistered: () => setIsRegistered(true),
        onUnregistered: () => setIsRegistered(false),
        onServerConnect: () => setIsConnected(true),
        onServerDisconnect: () => {
          setIsConnected(false);
          setIsRegistered(false);
          Logger.debug("[useTestCall] Disconnected from SIP server");
        },
        onCallReceived: async () => {
          await simpleUser?.answer();
          setIsCalling(true);
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
        },
        registererOptions: {
          expires: 120,
          refreshFrequency: 70,
          extraHeaders: [`X-App-Ref: ${appRef}`]
        }
      };

      const user = new Web.SimpleUser(TEST_PHONE_CONFIG.server, options);

      try {
        await user.connect();
        setSimpleUser(user);
      } catch (error) {
        Logger.error("[useTestCall] Failed to connect to SIP server", error);
        setSimpleUser(null);
        setIsConnected(false);
        setIsRegistered(false);
        setIsCalling(false);
      }
    },
    [simpleUser]
  );

  /**
   * register
   *
   * @description
   * Toggles SIP registration status.
   * Registers the user if not already registered, or unregisters otherwise.
   */
  const register = useCallback(async () => {
    if (!simpleUser) return;

    try {
      if (!isRegistered) {
        await simpleUser.register();
        setIsRegistered(true);
      } else {
        await simpleUser.unregister();
        setIsRegistered(false);
      }
    } catch (error) {
      Logger.error("[useTestCall] Registration error", error);
      setIsRegistered(false);
    }
  }, [simpleUser, isRegistered]);

  /**
   * call
   *
   * @description
   * Places or hangs up a SIP call to the configured test AOR.
   *
   * @param appRef - Application reference for SIP headers
   */
  const call = useCallback(
    async (appRef: string) => {
      if (!simpleUser) return;

      try {
        if (!isCalling) {
          await simpleUser.call(TEST_PHONE_CONFIG.targetAOR, {
            extraHeaders: [`X-App-Ref: ${appRef}`]
          });
        } else {
          await simpleUser.hangup();
        }
      } catch (error) {
        Logger.error("[useTestCall] Call error", error);
        setIsCalling(false);
      }
    },
    [simpleUser, isCalling]
  );

  /**
   * close
   *
   * @description
   * Disconnects the SIP session and resets all state.
   * Also stops audio playback.
   */
  const close = useCallback(() => {
    Logger.debug("[useTestCall] Closing SIP session");

    const shutdown = async () => {
      try {
        if (simpleUser) {
          await simpleUser.hangup().catch(() => {});
          await simpleUser.unregister().catch(() => {});
          await simpleUser.disconnect().catch(() => {});
          setSimpleUser(null);
        }
      } finally {
        setIsConnected(false);
        setIsRegistered(false);
        setIsCalling(false);

        if (audioRef.current) {
          const stream = audioRef.current.srcObject as MediaStream | null;
          audioRef.current.pause();
          audioRef.current.srcObject = null;

          stream?.getTracks().forEach((track) => track.stop());
        }
      }
    };

    shutdown();
  }, [simpleUser]);

  return {
    audioRef,
    state: {
      isConnected,
      isRegistered,
      isCalling
    },
    connect,
    register,
    call,
    close
  };
}

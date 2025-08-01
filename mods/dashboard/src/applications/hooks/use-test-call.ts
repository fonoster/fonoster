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

import { useCallback, useEffect, useState } from "react";
import { useSipTestCall } from "./use-sip";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { Logger } from "~/core/shared/logger";
import { useApplicationContext } from "../stores/application.store";

/**
 * useApplicationTestCall
 *
 * @description
 * Hook that integrates SIP-based test call logic with application context.
 * It manages call state, disables the UI when testing is unavailable, and handles lifecycle behavior
 * such as automatic connection and cleanup.
 *
 * @returns
 * - `audioRef`: Reference to audio element for media playback.
 * - `isTestCallDisabled`: Flag to disable the test call button.
 * - `isCalling`: Boolean representing an active test call.
 * - `onTestCall()`: Function to initiate the test call (with auto-connect if needed).
 */
export const useApplicationTestCall = () => {
  /** Disable the test button temporarily to prevent double clicks. */
  const [isTestCallDisabled, setIsTestCallDisabled] = useState(false);

  /** Get current application reference from context. */
  const {
    application: { ref: appRef }
  } = useApplicationContext();

  /** SIP call control and state from internal hook. */
  const {
    audioRef,
    state: { isConnected, isCalling },
    connect,
    call,
    close
  } = useSipTestCall();

  /**
   * onTestCall
   *
   * @description
   * Handles logic to initiate a SIP test call for the current application.
   * Ensures the application is saved, then connects and calls.
   */
  const onTestCall = useCallback(async () => {
    if (!appRef) {
      toast("Please complete the application and save it before testing.");
      return;
    }

    try {
      setIsTestCallDisabled(true);
      toast("Initiating test call...");

      // Ensure connection to SIP server before making a call
      if (!isConnected) await connect();

      await call(appRef);
    } catch (err) {
      toast(getErrorMessage(err));
    } finally {
      setIsTestCallDisabled(false);
    }
  }, [appRef, connect, call, isConnected]);

  /**
   * Automatically connect the test call agent when a valid application is present.
   * This enables test call buttons and avoids delay on first interaction.
   * 
   * TODO: This code is commented out because it causes issues with the test call
   *       agent not being able to connect properly. We need to investigate further.
   */
  // useEffect(() => {
  //   if (appRef && !isConnected) {
  //     connect().catch((error) => {
  //       Logger.debug(
  //         "[useApplicationTestCall] Failed to pre-connect test phone",
  //         error
  //       );
  //     });
  //   }
  // }, [appRef, isConnected, connect]);

  /**
   * Cleanup SIP session and disconnect audio stream when unmounting.
   */
  useEffect(() => {
    return () => {
      close();
    };
  }, [close]);

  return {
    audioRef,
    isTestCallDisabled,
    isCalling,
    onTestCall
  };
};

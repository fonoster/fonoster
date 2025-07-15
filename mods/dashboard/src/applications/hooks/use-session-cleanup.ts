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
import { useEffect } from "react";

/**
 * useSessionCleanup
 *
 * Custom React hook to call a cleanup function (e.g., close a session)
 * when the user closes the tab or browser window.
 *
 * @param cleanupFn - The function to call on beforeunload (should be synchronous or use sendBeacon for async)
 *
 * @example
 *   useSessionCleanup(close);
 */
export function useSessionCleanup(cleanupFn: () => void) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      cleanupFn();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [cleanupFn]);
}

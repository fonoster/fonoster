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
import { useSubmit } from "react-router";
import { Splash } from "~/core/components/general/splash/splash";
import { useFonoster } from "~/core/sdk/hooks/use-fonoster";
import { useLayoutEffect } from "react";

export { action } from "./logout.action";

/**
 * Logout page component.
 *
 * - Calls the logout function from the Fonoster SDK to clear any client-side tokens.
 * - Submits a POST request using react-router to trigger the logout action on the server.
 * - Displays a splash screen while the logout is being processed.
 */
export default function Logout() {
  /** Provides react-router's submit function to programmatically submit a form or action. */
  const submit = useSubmit();

  /** Custom hook that provides access to the Fonoster SDK logout function. */
  const { logout } = useFonoster();

  /**
   * useLayoutEffect ensures the logout logic runs synchronously
   * before the screen repaints, ensuring a smooth logout experience.
   */
  useLayoutEffect(() => {
    /** Clear the client-side session using the SDK. */
    logout();

    /**
     * Submit a POST request (with no body) to trigger the server-side logout action.
     * This will destroy the server session and redirect to the login page.
     */
    submit(null, { method: "post" });
  }, [logout, submit]);

  /** Renders a splash screen while logging out. */
  return <Splash />;
}

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
import { Page } from "~/core/components/general/page/page";
import type { Route } from "./+types/profile.page";
import { useRef } from "react";
import {
  PersonalSettingsForm,
  type PersonalSettingsFormHandle
} from "./profile.form";
import { Box } from "@mui/material";
import { Typography } from "~/core/components/design-system/ui/typography/typography";
import { Link } from "~/core/components/general/link/link";

/**
 * Page metadata function.
 *
 * Sets the page title for SEO and browser tab.
 *
 * @param {Route.MetaArgs} _ - Meta args provided by the route loader.
 * @returns {Array} An array containing the page title.
 */
export function meta(_: Route.MetaArgs) {
  return [{ title: "Personal Settings | Fonoster" }];
}

/**
 * Overview component (Workspace Settings Page).
 *
 * Renders the workspace profile form, allowing users to modify
 * workspace configuration and save changes. Includes a back navigation
 * button and a dynamic title based on the current workspace.
 *
 * @returns {JSX.Element} The rendered workspace profile page.
 */
export default function Profile() {
  /** Ref to access the form's imperative handle (e.g., submit method, isSubmitDisabled). */
  const formRef = useRef<PersonalSettingsFormHandle>(null);

  /**
   * Renders the workspace profile page with a header, workspace info, and profile form.
   */
  return (
    <Page>
      <Box sx={{ maxWidth: "440px" }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Link to="/">
            <Typography variant="body-small-underline">
              Back to dashboard
            </Typography>
          </Link>
          <Typography sx={{ marginBottom: "24px" }} variant="heading-small">
            Personal Settings
          </Typography>
        </Box>

        <PersonalSettingsForm ref={formRef} />
      </Box>
    </Page>
  );
}

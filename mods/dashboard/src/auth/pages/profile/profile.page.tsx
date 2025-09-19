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
import { PageHeader } from "~/core/components/general/page/page-header";
import type { Route } from "./+types/profile.page";
import { PersonalSettingsForm } from "./profile.form";
import { Box } from "@mui/material";
import { FormProvider } from "~/core/contexts/form-context";
import { FormSubmitButton } from "~/core/components/design-system/ui/form-submit-button/form-submit-button";
import { useNavigate } from "react-router";

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
 * Profile component (Personal Settings Page).
 *
 * Renders the personal settings form, allowing users to modify
 * their profile information and save changes. Includes a back navigation
 * button and a submit button in the header.
 *
 * @returns {JSX.Element} The rendered personal settings page.
 */
export default function Profile() {
  const navigate = useNavigate();

  const onGoBack = () => {
    navigate("/");
  };

  /**
   * Renders the personal settings page with a header and profile form.
   */
  return (
    <FormProvider>
      <Page>
        <PageHeader
          title="Personal Settings"
          description="Update your personal information and account settings."
          onBack={{ label: "Back to dashboard", onClick: onGoBack }}
          actions={
            <FormSubmitButton size="small" loadingText="Saving...">
              Save Changes
            </FormSubmitButton>
          }
        />

        <Box sx={{ maxWidth: "440px" }}>
          <PersonalSettingsForm />
        </Box>
      </Page>
    </FormProvider>
  );
}

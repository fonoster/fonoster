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
import type { Route } from "./+types/create-credential.page";
import { useRef } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateCredentialForm,
  type CreateCredentialFormHandle
} from "./create-credential.form";
import { useCreateCredential } from "./create-credential.hook";

/**
 * Page metadata for the "Create Credential" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Credentials | Fonoster" },
    {
      name: "description",
      content:
        "Credentials are used to authenticate SIP Agents and Trunks within your network."
    }
  ];
}

/**
 * CreateCredential component.
 *
 * Page component for creating a new voice credential.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering credential details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Credential page.
 */
export default function CreateCredential() {
  /** Ref to access the CreateCredentialForm's imperative handle (submit method). */
  const formRef = useRef<CreateCredentialFormHandle>(null);

  /** Custom hook to create a credential via API with optimistic updates. */
  const { onGoBack, onSave, isPending } = useCreateCredential();

  /**
   * Renders the Create Credential page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New Credentials"
        description="Credentials are used to authenticate SIP Agents and Trunks within your network."
        onBack={{ label: "Back to credentials", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Credential"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateCredentialForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}

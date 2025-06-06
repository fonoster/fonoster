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
import type { Route } from "./+types/create-acl.page";
import { useRef } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import { CreateAclForm, type CreateAclFormHandle } from "./create-acl.form";
import { useCreateAcl } from "./create-acl.hook";

/**
 * Page metadata for the "Create Acl" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create New ACL | Fonoster" },
    {
      name: "description",
      content: "Create a new ACL to protect your domains, peers, and trunks."
    }
  ];
}

/**
 * CreateAcl component.
 *
 * Page component for creating a new voice acl.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering acl details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Acl page.
 */
export default function CreateAcl() {
  /** Ref to access the CreateAclForm's imperative handle (submit method). */
  const formRef = useRef<CreateAclFormHandle>(null);

  /** Custom hook to create a acl via API with optimistic updates. */
  const { onGoBack, onSave, isPending } = useCreateAcl();

  /**
   * Renders the Create Acl page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New ACL"
        description="Create a new ACL to protect your domains, peers, and trunks."
        onBack={{ label: "Back to ACLs", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Acl"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateAclForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}

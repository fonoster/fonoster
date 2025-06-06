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
import type { Route } from "./+types/create-trunk.page";
import { useRef } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateTrunkForm,
  type CreateTrunkFormHandle
} from "./create-trunk.form";
import { useCreateTrunk } from "./create-trunk.hook";

/**
 * Page metadata for the "Create Trunk" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create New SIP Trunk | Fonoster" },
    {
      name: "description",
      content:
        "Add to your Project a SIP Provider to make and receive calls from regular phones. Complete the following form with the information given to you by your service provider."
    }
  ];
}

/**
 * CreateTrunk component.
 *
 * Page component for creating a new voice trunk.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering trunk details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Trunk page.
 */
export default function CreateTrunk() {
  /** Ref to access the CreateTrunkForm's imperative handle (submit method). */
  const formRef = useRef<CreateTrunkFormHandle>(null);

  /** Custom hook to create a trunk via API with optimistic updates. */
  const { onGoBack, onSave, isPending } = useCreateTrunk();

  /**
   * Renders the Create Trunk page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New SIP Trunk"
        description="Add to your Project a SIP Provider to make and receive calls from regular phones. Complete the following form with the information given to you by your service provider."
        onBack={{ label: "Back to trunks", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save SIP Trunk"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateTrunkForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}

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
import type { Route } from "./+types/create-agent.page";
import { useRef } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateAgentForm,
  type CreateAgentFormHandle
} from "./create-agent.form";
import { useCreateAgent } from "./create-agent.hook";

/**
 * Page metadata for the "Create Agent" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Create New Agent | Fonoster" },
    {
      name: "description",
      content:
        "SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)"
    }
  ];
}

/**
 * CreateAgent component.
 *
 * Page component for creating a new voice agent.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering agent details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Agent page.
 */
export default function CreateAgent() {
  /** Ref to access the CreateAgentForm's imperative handle (submit method). */
  const formRef = useRef<CreateAgentFormHandle>(null);

  /** Custom hook to create a agent via API with optimistic updates. */
  const { onGoBack, onSave, isPending } = useCreateAgent();

  /**
   * Renders the Create Agent page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New Agent"
        description="SIP Agents in the same Domain can call each other with Voice Over IP using a Software Phone (e.g Zoiper)"
        onBack={{ label: "Back to agents", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Agent"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateAgentForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}

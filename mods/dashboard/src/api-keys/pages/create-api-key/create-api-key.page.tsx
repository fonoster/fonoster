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
import type { Route } from "./+types/create-api-key.page";
import { useRef } from "react";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateApiKeyForm,
  type CreateApiKeyFormHandle
} from "./create-api-key.form";
import { useCreateApiKey } from "./create-api-key.hook";
import { Input } from "~/core/components/design-system/ui/input/input-read-only";

/**
 * Page metadata for the "Create ApiKey" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "API Keys | Fonoster" },
    {
      name: "description",
      content:
        "Key management here. API keys are encrypted values that you can use to make calls to Fonoster’s APIs. Your API Keys are only available for use within this Workspace."
    }
  ];
}

/**
 * CreateApiKey component.
 *
 * Page component for creating a new voice apiKey.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering apiKey details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create ApiKey page.
 */
export default function CreateApiKey() {
  /** Ref to access the CreateApiKeyForm's imperative handle (submit method). */
  const formRef = useRef<CreateApiKeyFormHandle>(null);

  /** Custom hook to create a apiKey via API with optimistic updates. */
  const { onGoBack, onSave, isPending, data } = useCreateApiKey();

  /**
   * Renders the Create ApiKey page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New API Key"
        description="Your API Keys are only available for use within this Workspace."
        onBack={{ label: "Back to API Keys", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save API Key"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box
        sx={{
          maxWidth: "440px",
          gap: "24px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        <CreateApiKeyForm ref={formRef} onSubmit={onSave} />

        {/* Display success message if API Key was created successfully */}
        {data && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Input label="Access Key ID" value={data.accessKeyId} disabled />
            <Input
              label="Secret Access Key"
              value={data.accessKeySecret}
              disabled
            />
          </Box>
        )}
      </Box>
    </Page>
  );
}

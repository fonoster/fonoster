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
import type { Route } from "./+types/create-number.page";
import { useCallback, useRef } from "react";
import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import { useNavigate } from "react-router";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Box } from "@mui/material";
import {
  CreateNumberForm,
  type CreateNumberFormHandle,
  type Schema
} from "./create-number.form";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";
import { useCreateNumber } from "~/numbers/services/numbers.service";
import { COUNTRIES } from "./create-number.const";
import { nonEmptyValues } from "~/core/helpers/remove-empty-values";
import { getErrorMessage } from "~/core/helpers/extract-error-message";

/**
 * Page metadata for the "Create Number" page.
 *
 * Sets the page title and description for SEO and browser tabs.
 *
 * @param _ - Meta arguments provided by the router (not used here).
 * @returns An array of metadata objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Numbers | Fonoster" },
    {
      name: "description",
      content:
        "A Number is a PSTN phone number that can be used to make or receive calls."
    }
  ];
}

/**
 * CreateNumber component.
 *
 * Page component for creating a new voice number.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for entering number details.
 *  - Save action to submit the form.
 *
 * @returns {JSX.Element} The rendered Create Number page.
 */
export default function CreateNumber() {
  /** Retrieves the current workspace ID for building navigation paths. */
  const workspaceId = useWorkspaceId();

  /** Hook to programmatically navigate between pages. */
  const navigate = useNavigate();

  /** Ref to access the CreateNumberForm's imperative handle (submit method). */
  const formRef = useRef<CreateNumberFormHandle>(null);

  /**
   * Handler for navigating back to the workspace numbers page.
   * Uses view transitions for smoother page transitions (if supported).
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/sip-network/numbers`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /** Custom hook to create a number via API with optimistic updates. */
  const { mutateAsync, isPending } = useCreateNumber();

  /**
   * Handler called after form submission.
   * Submits the data, shows a toast, and navigates back to the numbers page.
   *
   * @param {Schema} data - The validated form data from the form component.
   */
  const onSave = useCallback(
    async ({ country: countryIsoCode, ...data }: Schema) => {
      try {
        const country = COUNTRIES.find(({ value }) => value === countryIsoCode);

        if (!country) {
          toast("Oops! Invalid country selected.");
          return;
        }

        await mutateAsync({
          ...nonEmptyValues(data),
          country: country.label,
          countryIsoCode
        });
        toast("Number created successfully!");
        onGoBack();
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutateAsync, onGoBack]
  );

  /**
   * Renders the Create Number page layout.
   */
  return (
    <Page variant="form">
      <PageHeader
        title="Create New Number"
        description="A Number is a PSTN phone number that can be used to make or receive calls."
        onBack={{ label: "Back to numbers", onClick: onGoBack }}
        actions={
          <Button
            size="small"
            onClick={() => formRef.current?.submit()}
            disabled={formRef.current?.isSubmitDisabled || isPending}
          >
            {isPending ? "Saving..." : "Save Number"}
          </Button>
        }
      />

      {/* Form container with a max width for readability and consistent layout */}
      <Box sx={{ maxWidth: "440px" }}>
        <CreateNumberForm ref={formRef} onSubmit={onSave} />
      </Box>
    </Page>
  );
}

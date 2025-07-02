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

import { useCallback, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { useNavigate, useParams } from "react-router";

import { Page } from "~/core/components/general/page/page";
import { PageHeader } from "~/core/components/general/page/page-header";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Icon } from "~/core/components/design-system/icons/icons";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import {
  CreateApplicationForm,
  type CreateApplicationFormHandle
} from "../create-application/create-application.form";
import {
  useApplication,
  useUpdateApplication
} from "~/applications/services/applications.service";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { formatApplicationData } from "~/applications/services/format-application-data";
import type { Schema } from "../create-application/schemas/application-schema";
import { Splash } from "~/core/components/general/splash/splash";
import { useApplicationTestCall } from "~/applications/hooks/use-test-call";
import { useApplicationContext } from "~/applications/stores/application.store";

export function EditApplicationContainer() {
  /** Workspace context for routing. */
  const workspaceId = useWorkspaceId();

  /** Extract application reference from route. */
  const { ref } = useParams();

  /** Ref is required for fetch and update. Fail early if missing. */
  if (!ref) {
    throw new Error("Application reference is required");
  }

  /** Fetch the application by ref. */
  const { data, isLoading } = useApplication(ref);

  /** Mutation hook for submitting updates. */
  const { mutateAsync, isPending } = useUpdateApplication();

  /** Programmatic navigation hook. */
  const navigate = useNavigate();

  /** Form submit ref to trigger programmatically. */
  const formRef = useRef<CreateApplicationFormHandle>(null);

  /** UI state to avoid double submits. */
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  /** Application context setter. */
  const { setApplication } = useApplicationContext();

  /** Navigates back to applications list. */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /**
   * Form submission handler for updating application.
   *
   * @param data - Validated schema input from form
   */
  const onSave = useCallback(
    async ({ intelligence, ...data }: Schema) => {
      try {
        const formattedData = formatApplicationData({ intelligence, ...data });
        await mutateAsync({ ...formattedData, ref });

        toast("Application updated successfully!");
        setIsSubmitDisabled(true);
      } catch (error) {
        toast(getErrorMessage(error));
        setIsSubmitDisabled(false);
      }
    },
    [mutateAsync, ref]
  );

  /** Set current application context on load. */
  useEffect(() => {
    setApplication({ ref });
  }, [ref]);

  /** Initialize SIP test call logic. */
  const { onTestCall, audioRef, isCalling, isLoadingCall, hangup } =
    useApplicationTestCall();

  /** Show error and redirect if application was not found. */
  useEffect(() => {
    if (!isLoading && !data) {
      toast("Oops! You are trying to edit an application that does not exist.");
      onGoBack();
    }
  }, [isLoading, data, onGoBack]);

  /** Show splash screen during loading. */
  if (isLoading || !data) {
    return <Splash message="Loading application details..." />;
  }

  return (
    <>
      <Page variant="form">
        <PageHeader
          title="Edit Application"
          description="An Application defines how your Voice AI behaves. Use Autopilot for LLM-based agents or External for custom logic."
          onBack={{ label: "Back to voice applications", onClick: onGoBack }}
          actions={
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              {/* Submit button */}
              <Button
                size="small"
                onClick={() => formRef.current?.submit()}
                disabled={isSubmitDisabled || isPending}
              >
                {isPending ? "Saving..." : "Save Voice Application"}
              </Button>

              {/* Test Call button */}
              <Button
                onClick={isCalling || isLoadingCall ? hangup : onTestCall}
                variant="outlined"
                size="small"
                startIcon={
                  <Icon
                    name="Phone"
                    sx={{ fontSize: "16px !important", color: "inherit" }}
                  />
                }
              >
                {isCalling || isLoadingCall ? "Hangup" : "Test Call"}
              </Button>
            </Box>
          }
        />

        {/* Application form with initial values */}
        <Box sx={{ maxWidth: "440px" }}>
          <CreateApplicationForm
            ref={formRef}
            onSubmit={onSave}
            initialValues={data as Schema}
            isEdit={true}
          />
        </Box>
      </Page>

      {/* Audio element for SIP test call playback */}
      <audio ref={audioRef} autoPlay />
    </>
  );
}

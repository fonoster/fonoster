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

import { useCallback, useRef } from "react";
import { Box } from "@mui/material";
import { useNavigate } from "react-router";

import { Page } from "~/core/components/general/page/page";
import { PageHeader } from "~/core/components/general/page/page-header";
import { Button } from "~/core/components/design-system/ui/button/button";
import { Tooltip } from "~/core/components/design-system/ui/tooltip/tooltip";
import { Icon } from "~/core/components/design-system/icons/icons";
import { toast } from "~/core/components/design-system/ui/toaster/toaster";

import { useWorkspaceId } from "~/workspaces/hooks/use-workspace-id";
import {
  CreateApplicationForm,
  type CreateApplicationFormHandle
} from "./create-application.form";
import { useCreateApplication } from "~/applications/services/applications.service";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { formatApplicationData } from "~/applications/services/format-application-data";
import { useApplicationContext } from "~/applications/stores/application.store";
import type { Form, Schema } from "./schemas/application-schema";
import { useApplicationTestCall } from "~/applications/hooks/use-test-call";

export function CreateApplicationContainer() {
  /** The current workspace ID from route or context */
  const workspaceId = useWorkspaceId();

  /** Navigation handler */
  const navigate = useNavigate();

  /** Ref for imperatively triggering form submission */
  const formRef = useRef<CreateApplicationFormHandle>(null);

  /** API hook to create a new application */
  const { mutateAsync, isPending } = useCreateApplication();

  /** Access application context state */
  const { application, setApplication } = useApplicationContext();

  /** Handles navigation back to the list of applications */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /**
   * Handle successful form submission.
   * Formats and sends data to backend, updates context and UI state.
   *
   * @param data - Validated application schema
   */
  const onSave = useCallback(
    async ({ intelligence, ...data }: Schema, form: Form) => {
      try {
        const formattedData = formatApplicationData({ intelligence, ...data }, form);
        if (!formattedData) {
          // If formatApplicationData sets an error, it will return undefined
          return;
        }

        const { ref } = await mutateAsync(formattedData);

        setApplication({ ref });
        toast("Application created successfully!");

        // Navigate to edit page to prevent accidental duplicates and allow further configuration
        navigate(`/workspaces/${workspaceId}/applications/${ref}/edit`, {
          viewTransition: true
        });
      } catch (error) {
        toast(getErrorMessage(error));
      }
    },
    [mutateAsync, setApplication, navigate, workspaceId]
  );

  /** Hook for managing test call state and SIP stream */
  const { onTestCall, audioRef, isCalling, isLoadingCall, isAnswered, hangup } =
    useApplicationTestCall();

  return (
    <>
      <Page variant="form">
        <PageHeader
          title="Create New Application"
          description="An Application defines how your Voice AI behaves. Use Autopilot for LLM-based agents or External for custom logic."
          onBack={{ label: "Back to voice applications", onClick: onGoBack }}
          actions={
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              {/* Submit application form */}
              <Button
                size="small"
                onClick={() => formRef.current?.submit()}
                disabled={formRef.current?.isSubmitDisabled || isPending}
              >
                {isPending ? "Saving..." : "Save Voice Application"}
              </Button>

              {/* Run SIP test call */}
              <Tooltip
                title={
                  application?.ref
                    ? "Test the application with a call"
                    : "Save the application first to enable test calls"
                }
                placement="left"
              >
                <Button
                  onClick={() => {
                    if (!application?.ref) return;

                    return isAnswered ? hangup() : onTestCall();
                  }}
                  variant="outlined"
                  size="small"
                  disabled={isLoadingCall || (isCalling && !isAnswered)}
                  startIcon={
                    <Icon
                      name="Phone"
                      sx={{ fontSize: "16px !important", color: "inherit" }}
                    />
                  }
                >
                  {application?.ref
                    ? isCalling && !isAnswered
                      ? "Calling..."
                      : isAnswered
                        ? "Hangup"
                        : "Test Call"
                    : "Save to Test Call"}
                </Button>
              </Tooltip>
            </Box>
          }
        />

        {/* Application creation form */}
        <Box sx={{ maxWidth: "440px" }}>
          <CreateApplicationForm ref={formRef} onSubmit={onSave} />
        </Box>
      </Page>

      {/* Audio element to output test call audio via SIP */}
      <audio ref={audioRef} autoPlay />
    </>
  );
}

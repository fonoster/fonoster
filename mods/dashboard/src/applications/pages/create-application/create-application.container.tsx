/**
 * CreateApplicationContainer
 *
 * @description
 * UI component responsible for creating a new Voice AI application.
 * Integrates form handling, real-time application creation, SIP test call functionality,
 * and context updates using `useApplicationContext`.
 *
 * Responsibilities:
 * - Form submission and application creation via API.
 * - Navigation and view transitions.
 * - SIP test call initiation via `useTestCall`.
 * - Application-level context and UI state management.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useTestCall } from "~/applications/services/phone/use-phone";
import { getErrorMessage } from "~/core/helpers/extract-error-message";
import { formatApplicationData } from "~/applications/services/format-application-data";
import {
  ApplicationProvider,
  useApplicationContext
} from "~/applications/stores/application.store";
import type { Schema } from "./schemas/application-schema";

export function CreateApplicationContainer() {
  /** Extract workspace ID for routing context. */
  const workspaceId = useWorkspaceId();

  /** Programmatic navigation handler. */
  const navigate = useNavigate();

  /** Access to form submission method. */
  const formRef = useRef<CreateApplicationFormHandle>(null);

  /** Button state for preventing double submission. */
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(false);

  const [isTestCallDisabled, setIsTestCallDisabled] = useState(false);

  /** Create mutation hook for sending application data. */
  const { mutateAsync, isPending } = useCreateApplication();

  /** Context hook for setting and accessing the current application. */
  const { application, setApplication } = useApplicationContext();

  /** SIP calling logic and connection state from hook. */
  const {
    audioRef,
    state: { isConnected, isRegistered, isCalling },
    connect,
    register,
    call,
    close
  } = useTestCall();

  /**
   * Redirect back to the applications list for this workspace.
   */
  const onGoBack = useCallback(() => {
    navigate(`/workspaces/${workspaceId}/applications`, {
      viewTransition: true
    });
  }, [navigate, workspaceId]);

  /**
   * Handles form submission after validation.
   * Formats and sends the data to backend, then updates application context.
   *
   * @param data - Validated application form data
   */
  const onSave = useCallback(async ({ intelligence, ...data }: Schema) => {
    try {
      const formattedData = formatApplicationData({ intelligence, ...data });
      const { ref } = await mutateAsync(formattedData);

      setApplication({ ref });
      toast("Application created successfully!");
      setIsSubmitDisabled(true);
    } catch (error) {
      toast(getErrorMessage(error));
      setIsSubmitDisabled(false);
    }
  }, []);

  /**
   * Triggers a test call using the SIP client once the app has been saved.
   * Calls connect, register, and call in sequence.
   */
  const onTestCall = useCallback(async () => {
    if (!application.ref) {
      toast("Please complete the application and save it before testing.");
      return;
    }

    try {
      setIsTestCallDisabled(true);
      toast("Initiating test call...");

      const appRef = application.ref;

      if (!isConnected) await connect(appRef);

      if (!isRegistered) await register();

      await call(appRef);
    } catch (err) {
      toast(getErrorMessage(err));
    } finally {
      setIsTestCallDisabled(false);
    }
  }, [application, connect, register, call, isConnected, isRegistered]);

  /**
   * Cleanup SIP session on component unmount.
   */
  useEffect(() => {
    return () => {
      close(); // Hangs up any ongoing call
    };
  }, []);

  return (
    <ApplicationProvider>
      <Page variant="form">
        <PageHeader
          title="Create New Application"
          description="An Application defines how your Voice AI behaves. Use Autopilot for LLM-based agents or External for custom logic."
          onBack={{ label: "Back to voice applications", onClick: onGoBack }}
          actions={
            <Box sx={{ display: "flex", gap: 1, flexDirection: "column" }}>
              {/* Save Voice Application */}
              <Button
                size="small"
                onClick={() => formRef.current?.submit()}
                disabled={isSubmitDisabled || isPending}
              >
                {isPending ? "Saving..." : "Save Voice Application"}
              </Button>

              {/* Test Call functionality */}
              <Tooltip
                title={
                  application?.ref
                    ? "Test the application with a call"
                    : "Save the application first to enable test calls"
                }
                placement="left"
              >
                <Button
                  onClick={onTestCall}
                  variant="outlined"
                  size="small"
                  disabled={isCalling || isTestCallDisabled}
                  startIcon={
                    <Icon
                      name="Phone"
                      sx={{ fontSize: "16px !important", color: "inherit" }}
                    />
                  }
                >
                  {application?.ref
                    ? isCalling || isTestCallDisabled
                      ? "Calling..."
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

      {/* Audio output element for SIP media stream playback */}
      <audio ref={audioRef} autoPlay />
    </ApplicationProvider>
  );
}

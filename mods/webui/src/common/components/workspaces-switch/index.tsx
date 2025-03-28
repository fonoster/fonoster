import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Typography } from "@stories/typography/Typography";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import { usePopover } from "@/common/hooks/use-popover";
import { WorkspacesPopover } from "./workspaces-popover";
import { useWorkspaceContext } from "@/common/sdk/provider/WorkspaceContext";
import { CreateWorkspaceModal } from "@/pages/workspace/_components/CreateWorkspaceModal";
import { useState } from "react";

export function WorkspacesSwitch(): React.JSX.Element {
  const popover = usePopover<HTMLDivElement>();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    selectedWorkspace,
    workspaces,
    isLoading,
    handleSetSelectedWorkspace,
    refreshWorkspaces
  } = useWorkspaceContext();

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    popover.handleClose();
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateSuccess = () => {
    refreshWorkspaces();
  };

  if (isLoading) {
    return (
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          border: "1px solid var(--Workspaces-border-color)",
          borderRadius: "12px",
          p: "4px 8px",
          height: "40px"
        }}
      >
        <Box sx={{ flex: "1 1 auto" }}>
          <Typography
            color="var(--Workspaces-title-color)"
            variant="body-micro"
          >
            loading...
          </Typography>
          <Typography
            color="var(--Workspaces-name-color)"
            variant="body-medium"
          >
            waiting...
          </Typography>
        </Box>
      </Stack>
    );
  }

  return (
    <>
      <Stack
        direction="row"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        spacing={2}
        sx={{
          alignItems: "center",
          cursor: "pointer",
          padding: "0px 2px 0px 28px",
          minHeight: "42px"
        }}
      >
        <Box sx={{ flex: "1 1 auto" }}>
          <Typography
            color="var(--Workspaces-title-color)"
            variant="body-micro"
          >
            {process.env.NEXT_PUBLIC_FONOSTER_REGION || "NYC01"}
          </Typography>
          <Typography
            color="var(--Workspaces-name-color)"
            variant="body-medium"
          >
            {selectedWorkspace?.name}
          </Typography>
        </Box>
        {popover.open ? (
          <UnfoldLessIcon
            sx={{
              color: "var(--Workspaces-expand-color)",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}
          />
        ) : (
          <UnfoldMoreIcon
            sx={{
              color: "var(--Workspaces-expand-color)",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}
          />
        )}
      </Stack>
      <WorkspacesPopover
        anchorEl={popover.anchorRef.current}
        onChange={handleSetSelectedWorkspace}
        onClose={popover.handleClose}
        open={popover.open}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onNewWorkspace={handleOpenCreateModal}
      />
      <CreateWorkspaceModal
        open={isCreateModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}

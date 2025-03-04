import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { Workspace } from "@fonoster/types";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";

export interface WorkspacesPopoverProps {
  anchorEl: null | Element;
  onChange?: (tenant: string) => void;
  onClose?: () => void;
  open?: boolean;
  workspaces: Workspace[];
  selectedWorkspace?: Workspace | null;
}

export function WorkspacesPopover({
  anchorEl,
  onChange,
  onClose,
  open = false,
  workspaces,
  selectedWorkspace
}: WorkspacesPopoverProps): React.JSX.Element {
  const router = useRouter();

  const handleWorkspaceChange = (workspace: Workspace) => {
    // 1. Update the context with the selected workspace
    onChange?.(workspace.ref);

    // 2. Change the workspace ID in the current route
    const currentPath = router.asPath;
    const pathParts = currentPath.split("/");

    // Find the index of 'workspace' in the path
    const workspaceIndex = pathParts.findIndex((part) => part === "workspace");

    if (workspaceIndex !== -1 && workspaceIndex + 1 < pathParts.length) {
      // Replace the workspace ID in the path
      pathParts[workspaceIndex + 1] = workspace.ref;
      const newPath = pathParts.join("/");

      // Navigate to the new path
      router.push(newPath);
    }

    // 3. Close the popover
    onClose?.();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: "250px" } } }}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
    >
      {workspaces.map((workspace) => {
        const isSelected = selectedWorkspace?.ref === workspace.ref;

        return (
          <MenuItem
            key={workspace.name}
            onClick={() => handleWorkspaceChange(workspace)}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: isSelected ? "action.selected" : "inherit",
              "&:hover": {
                backgroundColor: isSelected ? "action.selected" : "action.hover"
              }
            }}
          >
            {workspace.name}
            {isSelected && (
              <Box
                sx={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "success.main",
                  ml: 1
                }}
              />
            )}
          </MenuItem>
        );
      })}
    </Menu>
  );
}

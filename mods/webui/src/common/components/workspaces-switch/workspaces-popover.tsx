import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import { Workspace } from "@fonoster/types";
import { useRouter } from "next/router";
import Box from "@mui/material/Box";
import { Typography } from "@stories/typography/Typography";
import { useTheme } from "@mui/material/styles";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";

export interface WorkspacesPopoverProps {
  anchorEl: null | Element;
  onChange?: (tenant: string) => void;
  onClose?: () => void;
  open?: boolean;
  workspaces: Workspace[];
  selectedWorkspace?: Workspace | null;
  onNewWorkspace?: () => void;
}

export function WorkspacesPopover({
  anchorEl,
  onChange,
  onClose,
  open = false,
  workspaces,
  selectedWorkspace,
  onNewWorkspace
}: WorkspacesPopoverProps): React.JSX.Element {
  const router = useRouter();
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const secondaryColor900 = theme.palette.secondary.dark;
  const hoverColor = theme.palette.secondary.light;
  const textColor = theme.palette.text.secondary;

  const handleWorkspaceChange = (workspace: Workspace) => {
    onChange?.(workspace.ref);

    const currentPath = router.asPath;
    const pathParts = currentPath.split("/");

    const workspaceIndex = pathParts.findIndex((part) => part === "workspace");

    if (workspaceIndex !== -1 && workspaceIndex + 1 < pathParts.length) {
      pathParts[workspaceIndex + 1] = workspace.ref;
      const newPath = pathParts.join("/");
      router.push(newPath);
    }
    onClose?.();
  };

  const handleNewWorkspace = () => {
    if (onNewWorkspace) {
      onNewWorkspace();
    }
    onClose?.();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={onClose}
      open={open}
      sx={{
        "& .MuiPaper-root": {
          left: "6% !important",
          transform: "translateX(-47%) !important",
          [theme.breakpoints.up("xs")]: { top: "120px !important" },
          [theme.breakpoints.up("sm")]: { top: "136px !important" },
          [theme.breakpoints.up("md")]: { top: "153px !important" }
        }
      }}
      slotProps={{
        paper: {
          sx: {
            width: "200px",
            mt: 0,
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            borderRadius: 0,
            overflow: "hidden",
            padding: 0,
            backgroundColor: "#FFFFFF",
            borderTop: "none",
            [theme.breakpoints.up("xs")]: { top: "120px !important" },
            [theme.breakpoints.up("sm")]: { top: "136px !important" },
            [theme.breakpoints.up("md")]: { top: "153px !important" }
          }
        }
      }}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
    >
      {workspaces.flatMap((workspace, index) => {
        const isSelected = selectedWorkspace?.ref === workspace.ref;

        const menuItems = [
          <MenuItem
            key={`workspace-${workspace.name}`}
            onClick={() => handleWorkspaceChange(workspace)}
            sx={{
              py: 2,
              px: 3,
              display: "flex",
              height: "36px",
              "&:hover": {
                backgroundColor: hoverColor
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography
                variant="body-medium"
                sx={{
                  color: textColor,
                  fontWeight: 400
                }}
              >
                {workspace.name}
              </Typography>
              {isSelected && (
                <Box
                  sx={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: primaryColor,
                    ml: 1
                  }}
                />
              )}
            </Box>
          </MenuItem>
        ];

        if (index < workspaces.length - 1) {
          menuItems.push(
            <Divider key={`divider-${workspace.name}`} sx={{ margin: "0" }} />
          );
        }

        return menuItems;
      })}
      <Divider sx={{ margin: "0" }} />
      <MenuItem
        onClick={handleNewWorkspace}
        sx={{
          py: 2,
          px: 3,
          color: secondaryColor,
          height: "36px",
          "&:hover": {
            backgroundColor: hoverColor
          }
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            justifyContent: "space-between",
            "&:hover": {
              color: secondaryColor900
            }
          }}
        >
          <Typography variant="body-medium">New Workspace</Typography>
          <AddOutlinedIcon
            fontSize="small"
            sx={{
              fontSize: "18px"
            }}
          />
        </Box>
      </MenuItem>
    </Menu>
  );
}

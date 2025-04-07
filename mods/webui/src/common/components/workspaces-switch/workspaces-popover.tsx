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
  const secondaryColor = theme.palette.secondary["500"];
  const secondaryColor900 = theme.palette.secondary["900"];
  const hoverColor = theme.palette.secondary["50"];
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
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "left"
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "left"
      }}
      onClose={onClose}
      open={open}
      sx={{
        "& .MuiPaper-root": {
          transform: "translateX(-6.1%) !important"
        }
      }}
      slotProps={{
        paper: {
          sx: {
            boxShadow: "0px 8px 20px -4px rgba(0, 0, 0, 0.10)",
            borderRadius: 0,
            overflow: "hidden",
            padding: 0,
            backgroundColor: "#FFFFFF",
            borderTop: "solid 1px #E8E8E8",
            borderRight: "solid 1px #E8E8E8",
            margin: "0",
            marginTop: "0px",
            width:
              anchorEl instanceof HTMLElement ? anchorEl.offsetWidth : undefined
          }
        },
        list: {
          sx: {
            padding: "0",
            "& li": {
              borderBottom: "solid 1px #E8E8E8",

              "&:last-child": {
                borderBottom: "none"
              }
            }
          }
        }
      }}
    >
      {workspaces.flatMap((workspace) => {
        const isSelected = selectedWorkspace?.ref === workspace.ref;

        return (
          <MenuItem
            key={`workspace-${workspace.name}`}
            onClick={() => handleWorkspaceChange(workspace)}
            sx={{
              padding: "0px 16px 0px 40px",
              display: "flex",
              height: "36px",
              "&:hover": {
                backgroundColor: hoverColor
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
              <Typography
                variant="drawer-label"
                sx={{
                  color: textColor
                }}
                style={{
                  display: "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  WebkitLineClamp: 1
                }}
              >
                {workspace.name}
              </Typography>
              {isSelected && (
                <Box
                  sx={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    backgroundColor: primaryColor,
                    marginLeft: "4px"
                  }}
                />
              )}
            </Box>
          </MenuItem>
        );
      })}

      <MenuItem
        onClick={handleNewWorkspace}
        sx={{
          padding: "0px 16px 0px 40px",
          height: "36px",
          color: secondaryColor,
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
            transition: "color 0.2s",
            "&:hover": {
              color: secondaryColor900
            }
          }}
        >
          <Typography variant="drawer-label">New Workspace</Typography>
          <AddOutlinedIcon
            fontSize="small"
            sx={{
              fontSize: "12px",
              marginLeft: "4px"
            }}
          />
        </Box>
      </MenuItem>
    </Menu>
  );
}

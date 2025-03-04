import { useState } from "react";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  styled,
  Box
} from "@mui/material";
import WorkspacesIcon from "@mui/icons-material/Workspaces";

interface Workspace {
  id: string;
  name: string;
  description: string;
}

const workspaces: Workspace[] = [
  {
    id: "1",
    name: "Workspace Development",
    description: "Entorno de desarrollo principal"
  },
  {
    id: "2",
    name: "Workspace Production",
    description: "Entorno de producción"
  },
  {
    id: "3",
    name: "Workspace Testing",
    description: "Entorno de pruebas"
  }
];

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  padding: theme.spacing(1, 1.4),
  "&:hover": {
    backgroundColor: theme.palette.action.hover
  }
}));

const WorkspaceSelector = () => {
  const [selectedWorkspace, setSelectedWorkspace] = useState(workspaces[0]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    handleClose();
  };

  const listItem = (
    <ListItem sx={{ p: 0 }}>
      <StyledListItemButton onClick={handleClick}>
        <ListItemIcon sx={{ minWidth: 34, mr: 1.2 }}>
          <WorkspacesIcon sx={{ color: "primary.main" }} />
        </ListItemIcon>
        <ListItemText
          primary={selectedWorkspace.name}
          secondary={selectedWorkspace.description}
          primaryTypographyProps={{
            variant: "body2",
            noWrap: true
          }}
          secondaryTypographyProps={{
            variant: "caption",
            noWrap: true
          }}
        />
      </StyledListItemButton>
    </ListItem>
  );

  return (
    <>
      {/* Renderiza el item con o sin tooltip según el estado del sidebar */}
      <Tooltip
        title={selectedWorkspace.name}
        placement="right"
        sx={{
          display: "none",
          ".mini-sidebar &": { display: "block" }
        }}
      >
        {listItem}
      </Tooltip>
      <Box
        sx={{
          display: "block",
          ".mini-sidebar &": { display: "none" }
        }}
      >
        {listItem}
      </Box>

      {/* Menú desplegable */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            width: 320,
            maxWidth: "100%",
            mt: 1,
            border: "1px solid",
            borderColor: "divider"
          }
        }}
      >
        {workspaces.map((workspace) => (
          <MenuItem
            key={workspace.id}
            selected={workspace.id === selectedWorkspace.id}
            onClick={() => handleSelect(workspace)}
            sx={{
              py: 1,
              "&.Mui-selected": {
                bgcolor: "primary.lighter",
                "&:hover": {
                  bgcolor: "primary.light"
                }
              }
            }}
          >
            <ListItemText
              primary={workspace.name}
              secondary={workspace.description}
              primaryTypographyProps={{
                fontWeight: workspace.id === selectedWorkspace.id ? 600 : 400,
                color:
                  workspace.id === selectedWorkspace.id
                    ? "primary.main"
                    : "text.primary"
              }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default WorkspaceSelector;

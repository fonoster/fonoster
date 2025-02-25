'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export const workspaces = [
  { name: 'Demo Workspace', avatar: 'Demo 1' },
  { name: 'Demo Workspace 2', avatar: 'Demo 2' },
] satisfies Workspaces[];

export interface Workspaces {
  name: string;
  avatar: string;
}

export interface WorkspacesPopoverProps {
  anchorEl: null | Element;
  onChange?: (tenant: string) => void;
  onClose?: () => void;
  open?: boolean;
}

export function WorkspacesPopover({
  anchorEl,
  onChange,
  onClose,
  open = false,
}: WorkspacesPopoverProps): React.JSX.Element {
  return (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '250px' } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    >
      {workspaces.map((workspace) => (
        <MenuItem
          key={workspace.name}
          onClick={() => {
            onChange?.(workspace.name);
          }}
        >
          <ListItemAvatar>
            <Avatar src={workspace.avatar} sx={{ '--Avatar-size': '32px' }} variant="rounded" />
          </ListItemAvatar>
          {workspace.name}
        </MenuItem>
      ))}
    </Menu>
  );
}

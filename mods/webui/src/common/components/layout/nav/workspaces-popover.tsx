'use client';

import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export interface Workspaces {
  name: string;
  avatar: string;
  ref: string;
}

export interface WorkspacesPopoverProps {
  anchorEl: null | Element;
  onChange?: (tenant: string) => void;
  onClose?: () => void;
  open?: boolean;
  workspaces: Workspaces[];
}

export function WorkspacesPopover({
  anchorEl,
  onChange,
  onClose,
  open = false,
  workspaces,
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
            onChange?.(workspace.ref);
          }}
        >
          {workspace.name}
        </MenuItem>
      ))}
    </Menu>
  );
}

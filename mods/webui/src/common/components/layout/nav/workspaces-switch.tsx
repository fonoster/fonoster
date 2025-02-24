'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';

import { usePopover } from '@/common/hooks/use-popover';
import { workspaces, WorkspacesPopover } from './workspaces-popover';

export function WorkspacesSwitch(): React.JSX.Element {
  const popover = usePopover<HTMLDivElement>();
  const workspace = workspaces[0];

  return (
    <React.Fragment>
      <Stack
        direction="row"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        spacing={2}
        sx={{
          alignItems: 'center',
          border: '1px solid var(--Workspaces-border-color)',
          borderRadius: '12px',
          cursor: 'pointer',
          p: '4px 8px',
        }}
      >
        <Avatar src={workspace.avatar} variant="rounded" />
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography color="var(--Workspaces-title-color)" variant="caption">
            Condominio
          </Typography>
          <Typography color="var(--Workspaces-name-color)" variant="subtitle2">
            {workspace.name}
          </Typography>
        </Box>
        <CaretUpDownIcon color="var(--Workspaces-expand-color)" fontSize="var(--icon-fontSize-sm)" />
      </Stack>
      <WorkspacesPopover
        anchorEl={popover.anchorRef.current}
        onChange={popover.handleClose}
        onClose={popover.handleClose}
        open={popover.open}
      />
    </React.Fragment>
  );
}

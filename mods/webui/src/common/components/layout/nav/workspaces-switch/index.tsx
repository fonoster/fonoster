import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { CaretUpDown as CaretUpDownIcon } from '@phosphor-icons/react/dist/ssr/CaretUpDown';
import { usePopover } from '@/common/hooks/use-popover';
import { WorkspacesPopover } from './workspaces-popover';
import { useWorkspaceContext } from '@/common/sdk/provider/WorkspaceContext';

export function WorkspacesSwitch(): React.JSX.Element {
  const popover = usePopover<HTMLDivElement>();

  const { selectedWorkspace, workspaces, isLoading, handleSetSelectedWorkspace } = useWorkspaceContext();

  if (isLoading) {
    return (
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
          border: '1px solid var(--Workspaces-border-color)',
          borderRadius: '12px',
          p: '4px 8px',
          height: '48px', // Altura fija para evitar saltos
        }}
      >
        <CircularProgress size={24} color="primary" />
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography color="var(--Workspaces-title-color)" variant="caption">
            loading...
          </Typography>
          <Typography color="var(--Workspaces-name-color)" variant="subtitle2">
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
          alignItems: 'center',
          border: '1px solid var(--Workspaces-border-color)',
          borderRadius: '12px',
          cursor: 'pointer',
          p: '4px 8px',
          height: '48px', // Misma altura que el estado de carga
        }}
      >
        <Box sx={{ flex: '1 1 auto' }}>
          <Typography color="var(--Workspaces-title-color)" variant="caption">
            {process.env.NEXT_PUBLIC_FONOSTER_REGION || 'NYC01'}
          </Typography>
          <Typography color="var(--Workspaces-name-color)" variant="subtitle2">
            {selectedWorkspace?.name}
          </Typography>
        </Box>
        <CaretUpDownIcon color="var(--Workspaces-expand-color)" fontSize="var(--icon-fontSize-sm)" />
      </Stack>
      <WorkspacesPopover
        anchorEl={popover.anchorRef.current}
        onChange={handleSetSelectedWorkspace}
        onClose={popover.handleClose}
        open={popover.open}
        workspaces={workspaces}
      />
    </>
  );
}

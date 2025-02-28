import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import type { User } from '@/types/user';
import { usePopover } from '@/common/hooks/use-popover';

// import { MobileNav } from './sidebar/mobile';
import { NotificationsPopover } from './notifications';
import { UserPopover } from './user-popover';
import { stringAvatar } from '@/utils/stringAvatar';
import { Logo } from '../../../logo/Logo'

export interface HeaderProps { }

const user = {
  id: '1',
  name: 'Fonoster',
  avatar: 'https://avatars.githubusercontent.com/u/1099404?v=4',
  email: 'support@fonoster.com',
} as User;

export function Header({
  hamburgerIcon,
}: {
  hamburgerIcon?: React.ReactNode;
}): React.JSX.Element {

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          '--MainNav-background': 'var(--mui-palette-background-default)',
          '--MainNav-divider': '#E0E0E0',
          bgcolor: 'var(--MainNav-background)',
          borderBottom: '1px solid #E0E0E0',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
          left: 0,
          position: 'sticky',
          top: 0,
          zIndex: 'var(--MainNav-zIndex, 1000)',
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            minHeight: 64,
            px: 2,
            py: 1,
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <Logo size="small" />
          </Box>
          {hamburgerIcon}
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end' }}
          >
            <NotificationsButton />
            <UserButton />
          </Stack>
        </Stack>
      </Box>
    </React.Fragment>
  );
}

function NotificationsButton(): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();

  return (
    <React.Fragment>
      <Tooltip title="Notificaciones">
        <Badge
          color="error"
          sx={{ '& .MuiBadge-dot': { borderRadius: '50%', height: '10px', right: '6px', top: '6px', width: '10px' } }}
          variant="dot"
        >
          <IconButton
            onClick={popover.handleOpen}
            ref={popover.anchorRef}
            sx={{
              backgroundColor: 'rgba(0, 171, 85, 0.08)',
              borderRadius: '50%',
              '&:hover': {
                backgroundColor: 'rgba(0, 171, 85, 0.16)',
              }
            }}
          >
            <BellIcon />
          </IconButton>
        </Badge>
      </Tooltip>
      <NotificationsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
    </React.Fragment>
  );
}

export function UserButton(): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();

  return (
    <React.Fragment>
      <Box
        component="button"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        sx={{
          border: 'none',
          background: 'rgba(0, 171, 85, 0.08)',
          cursor: 'pointer',
          p: 0.5,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&:hover': {
            backgroundColor: 'rgba(0, 171, 85, 0.16)',
          }
        }}
      >
        <Badge
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          color="success"
          sx={{
            '& .MuiBadge-dot': {
              border: '2px solid var(--MainNav-background)',
              borderRadius: '50%',
              bottom: '6px',
              height: '12px',
              right: '6px',
              width: '12px',
            },
          }}
          variant="dot"
        >
          {user && <Avatar {...stringAvatar(user?.name as string)} />}
        </Badge>
      </Box>
      {
        user && (
          <UserPopover user={user as User} anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
        )
      }
    </React.Fragment>
  );
}

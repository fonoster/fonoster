'use client';

import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { Bell as BellIcon } from '@phosphor-icons/react/dist/ssr/Bell';
import { List as ListIcon } from '@phosphor-icons/react/dist/ssr/List';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
// import { useTranslation } from 'next-i18next';

import type { NavItemConfig } from '@/types/layout';
import type { User } from '@/types/user';
import { usePopover } from '@/common/hooks/use-popover';

import { MobileNav } from '../mobile-nav';
import { NotificationsPopover } from '../notifications-popover';
import { UserPopover } from '../user-popover/user-popover';
// import { useUser } from '@/hooks/use-user';
import { stringAvatar } from '@/utils/stringAvatar';

export interface MainNavProps {
  items: NavItemConfig[];
}

const user = {
  id: '1',
  name: 'Fonoster',
  avatar: 'https://avatars.githubusercontent.com/u/1099404?v=4',
  email: 'support@fonoster.com',
} as User;

export function MainNav({ items }: MainNavProps): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          '--MainNav-background': 'var(--mui-palette-background-default)',
          '--MainNav-divider': '#E0E0E0',
          bgcolor: 'var(--MainNav-background)',
          borderBottom: '1px solid #E0E0E0',
          left: 0,
          position: 'sticky',
          pt: { lg: 'var(--Layout-gap)' },
          top: 0,
          width: '100%',
          zIndex: 'var(--MainNav-zIndex)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flex: '1 1 auto',
            minHeight: 'var(--MainNav-height)',
            px: { xs: 2, lg: 3 },
            py: 1,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flex: '1 1 auto' }}>
            <IconButton
              onClick={(): void => {
                setOpenNav(true);
              }}
              sx={{ display: { lg: 'none' } }}
            >
              <ListIcon />
            </IconButton>
          </Stack>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', flex: '1 1 auto', justifyContent: 'flex-end' }}
          >
            <NotificationsButton />
            <UserButton />
          </Stack>
        </Box>
      </Box>
      <MobileNav
        items={items}
        onClose={() => {
          setOpenNav(false);
        }}
        open={openNav}
      />
    </React.Fragment>
  );
}

/* function SearchButton(): React.JSX.Element {
  const dialog = useDialog();

  return (
    <React.Fragment>
      <Tooltip title="Buscar">
        <IconButton onClick={dialog.handleOpen} sx={{ display: { xs: 'inline-flex', lg: 'inline-flex' } }}>
          <MagnifyingGlassIcon />
        </IconButton>
      </Tooltip>
      <SearchDialog onClose={dialog.handleClose} open={dialog.open} />
    </React.Fragment>
  );
} */

function ContactsButton(): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();

  return (
    <React.Fragment>
      <Tooltip title="Contacts">
        <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
          <UsersIcon />
        </IconButton>
      </Tooltip>
      {/* <ContactsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} /> */}
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
          <IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
            <BellIcon />
          </IconButton>
        </Badge>
      </Tooltip>
      <NotificationsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
    </React.Fragment>
  );
}

// function LanguageSwitch(): React.JSX.Element {
//   const { i18n } = useTranslation();
//   const popover = usePopover<HTMLButtonElement>();
//   const language = (i18n.language || 'en') as Language;
//   const flag = languageFlags[language];

//   return (
//     <React.Fragment>
//       <Tooltip title="Language">
//         <IconButton
//           onClick={popover.handleOpen}
//           ref={popover.anchorRef}
//           sx={{ display: { xs: 'none', lg: 'inline-flex' } }}
//         >
//           <Box sx={{ height: '24px', width: '24px' }}>
//             <Box alt={language} component="img" src={flag} sx={{ height: 'auto', width: '100%' }} />
//           </Box>
//         </IconButton>
//       </Tooltip>
//       <LanguagePopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
//     </React.Fragment>
//   );
// }

export function UserButton(): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();
  // const { user } = useUser();

  return (
    <React.Fragment>
      <Box
        component="button"
        onClick={popover.handleOpen}
        ref={popover.anchorRef}
        sx={{ border: 'none', background: 'transparent', cursor: 'pointer', p: 0 }}
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

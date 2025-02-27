import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { ChatText as ChatTextIcon } from '@phosphor-icons/react/dist/ssr/ChatText';
import { EnvelopeSimple as EnvelopeSimpleIcon } from '@phosphor-icons/react/dist/ssr/EnvelopeSimple';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { X as XIcon } from '@phosphor-icons/react/dist/ssr/X';

import { dayjs } from '@/utils/dayjs';

export type Notification = { id: string; createdAt: Date; read: boolean } & (
  | { type: 'new_feature'; description: string }
  | { type: 'new_company'; author: { name: string; avatar?: string }; company: { name: string } }
  | { type: 'new_job'; author: { name: string; avatar?: string }; job: { title: string } }
  | { type: 'welcome'; author: { name: string; avatar?: string }; job: { title: string } }
);

const notifications = [
  {
    id: '9999',
    createdAt: dayjs().subtract(7, 'minute').subtract(5, 'hour').subtract(1, 'day').toDate(),
    read: false,
    type: 'welcome',
    author: { name: 'Fonoster', avatar: '/assets/avatar-8.png' },
    job: { title: 'Welcome' },
  },
  // {
  //   id: 'EV-003',
  //   createdAt: dayjs().subtract(18, 'minute').subtract(3, 'hour').subtract(5, 'day').toDate(),
  //   read: true,
  //   type: 'new_job',
  //   author: { name: 'Fran Perez', avatar: '/assets/avatar-5.png' },
  //   job: { title: 'Senior Golang Backend Engineer' },
  // }
] satisfies Notification[];

export interface NotificationsPopoverProps {
  anchorEl: null | Element;
  onClose?: () => void;
  onMarkAllAsRead?: () => void;
  onRemoveOne?: (id: string) => void;
  open?: boolean;
}

export function NotificationsPopover({
  anchorEl,
  onClose,
  onMarkAllAsRead,
  onRemoveOne,
  open = false,
}: NotificationsPopoverProps): React.JSX.Element {
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '380px' } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    >
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
        <Typography variant="h6">Notificaciones</Typography>
        <Tooltip title="Marcar todos como leídos">
          <IconButton edge="end" onClick={onMarkAllAsRead}>
            <EnvelopeSimpleIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {notifications.length === 0 ? (
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2">Sin notificaciones</Typography>
        </Box>
      ) : (
        <Box sx={{ maxHeight: '270px', overflowY: 'auto' }}>
          <List disablePadding>
            {notifications.map((notification, index) => (
              <NotificationItem
                divider={index < notifications.length - 1}
                key={notification.id}
                notification={notification}
                onRemove={() => {
                  onRemoveOne?.(notification.id);
                }}
              />
            ))}
          </List>
        </Box>
      )}
    </Popover>
  );
}

interface NotificationItemProps {
  divider?: boolean;
  notification: Notification;
  onRemove?: () => void;
}

function NotificationItem({ divider, notification, onRemove }: NotificationItemProps): React.JSX.Element {
  return (
    <ListItem divider={divider} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <NotificationContent notification={notification} />
      <Tooltip title="Remove">
        <IconButton edge="end" onClick={onRemove} size="small">
          <XIcon />
        </IconButton>
      </Tooltip>
    </ListItem>
  );
}

interface NotificationContentProps {
  notification: Notification;
}

function NotificationContent({ notification }: NotificationContentProps): React.JSX.Element {
  if (notification.type === 'new_feature') {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Avatar>
          <ChatTextIcon fontSize="var(--Icon-fontSize)" />
        </Avatar>
        <div>
          <Typography variant="subtitle2">Nueva carcaterística!</Typography>
          <Typography variant="body2">{notification.description}</Typography>
          <Typography color="text.secondary" variant="caption">
            {dayjs(notification.createdAt).format('MMM D, hh:mm A')}
          </Typography>
        </div>
      </Stack>
    );
  }

  if (notification.type === 'new_company') {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Avatar src={notification.author.avatar}>
          <UserIcon />
        </Avatar>
        <div>
          <Typography variant="body2">
            <Typography component="span" variant="subtitle2">
              {notification.author.name}
            </Typography>{' '}
            created{' '}
            <Link underline="always" variant="body2">
              {notification.company.name}
            </Link>{' '}
            empresa
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {dayjs(notification.createdAt).format('MMM D, hh:mm A')}
          </Typography>
        </div>
      </Stack>
    );
  }

  if (notification.type === 'new_job') {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Avatar src={notification.author.avatar}>
          <UserIcon />
        </Avatar>
        <div>
          <Typography variant="body2">
            <Typography component="span" variant="subtitle2">
              {notification.author.name}
            </Typography>{' '}
            agregar nuevo{' '}
            <Link underline="always" variant="body2">
              {notification.job.title}
            </Link>
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {dayjs(notification.createdAt).format('MMM D, hh:mm A')}
          </Typography>
        </div>
      </Stack>
    );
  }

  return <div />;
}

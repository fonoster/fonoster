import * as React from "react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import ListItem from "@mui/material/ListItem";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { Typography } from "@stories/typography/Typography";
import { ChatText as ChatTextIcon } from "@phosphor-icons/react/dist/ssr/ChatText";
import { User as UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { X as XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { NotificationDropdown } from "@stories/notificationdropdown/NotificationDropdown";

import { dayjs } from "@/utils/dayjs";
import { User } from "@/types/user";

export type Notification = { id: string; createdAt: Date; read: boolean } & (
  | { type: "new_feature"; description: string }
  | {
      type: "new_company";
      author: { name: string; avatar?: string };
      company: { name: string };
    }
  | {
      type: "new_job";
      author: { name: string; avatar?: string };
      job: { title: string };
    }
  | {
      type: "welcome";
      author: { name: string; avatar?: string };
      job: { title: string };
    }
);

const notifications = [
  {
    id: "9999",
    createdAt: dayjs()
      .subtract(7, "minute")
      .subtract(5, "hour")
      .subtract(1, "day")
      .toDate(),
    read: false,
    type: "welcome",
    author: { name: "Fonoster", avatar: "/assets/avatar-8.png" },
    job: { title: "Welcome" }
  }
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
  user: User;
}

export function NotificationsPopover({
  anchorEl,
  onClose,
  onMarkAllAsRead,
  onRemoveOne,
  open = false,
  user
}: NotificationsPopoverProps): React.JSX.Element {
  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      onClose={onClose}
      open={Boolean(open)}
      transformOrigin={{ horizontal: "right", vertical: "top" }}
      PaperProps={{
        sx: {
          width: "251px",
          p: 0,
          mt: 3,
          boxShadow: "0px 5px 10px 0px #0000001A"
        }
      }}
    >
      <NotificationDropdown
        notifications={[
          {
            id: "1",
            isRead: false,
            message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
            timestamp: "x hours ago"
          },
          {
            id: "2",
            isRead: true,
            message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
            timestamp: "x hours ago"
          },
          {
            id: "3",
            isRead: true,
            message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
            timestamp: "x hours ago"
          }
        ]}
        onNotificationClick={onClose}
        onVisitSiteClick={() => {}}
      />
    </Popover>
  );
}

interface NotificationItemProps {
  divider?: boolean;
  notification: Notification;
  onRemove?: () => void;
  user: User;
}

function NotificationItem({
  divider,
  notification,
  onRemove,
  user
}: NotificationItemProps): React.JSX.Element {
  return (
    <ListItem
      divider={divider}
      sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
    >
      <NotificationContent notification={notification} user={user} />
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
  user: User;
}

function NotificationContent({
  notification,
  user
}: NotificationContentProps): React.JSX.Element {
  if (notification.type === "new_feature") {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar>
          <ChatTextIcon fontSize="var(--Icon-fontSize)" />
        </Avatar>
        <div>
          <Typography variant="heading-small">New feature!</Typography>
          <Typography variant="body-medium">
            {notification.description}
          </Typography>
          <Typography variant="body-small" sx={{ color: "text.secondary" }}>
            {dayjs(notification.createdAt).format("MMM D, hh:mm A")}
          </Typography>
        </div>
      </Stack>
    );
  }

  if (notification.type === "new_company") {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar src={notification.author.avatar}>
          <UserIcon />
        </Avatar>
        <div>
          <Typography variant="body-medium">
            <Typography component="span" variant="heading-small">
              {notification.author.name}
            </Typography>{" "}
            created <Link underline="always">{notification.company.name}</Link>{" "}
            empresa
          </Typography>
          <Typography variant="body-small" sx={{ color: "text.secondary" }}>
            {dayjs(notification.createdAt).format("MMM D, hh:mm A")}
          </Typography>
        </div>
      </Stack>
    );
  }

  if (notification.type === "new_job") {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar src={notification.author.avatar}>
          <UserIcon />
        </Avatar>
        <div>
          <Typography variant="body-medium">
            <Typography component="span" variant="heading-small">
              {notification.author.name}
            </Typography>{" "}
            agregar nuevo{" "}
            <Link underline="always">{notification.job.title}</Link>
          </Typography>
          <Typography variant="body-small" sx={{ color: "text.secondary" }}>
            {dayjs(notification.createdAt).format("MMM D, hh:mm A")}
          </Typography>
        </div>
      </Stack>
    );
  }

  if (notification.type === "welcome") {
    return (
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar src={user.avatar}>
          <UserIcon />
        </Avatar>
        <div>
          <Typography variant="body-medium">
            <Typography component="span" variant="heading-small">
              {notification.author.name}
            </Typography>{" "}
            welcomes you to {user.name}
          </Typography>
          <Typography variant="body-small" sx={{ color: "text.secondary" }}>
            {dayjs(notification.createdAt).format("MMM D, hh:mm A")}
          </Typography>
        </div>
      </Stack>
    );
  }

  return <div />;
}

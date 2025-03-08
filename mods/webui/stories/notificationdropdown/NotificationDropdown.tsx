/*
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  NotificationDropdownContainer,
  NotificationDropdownContent,
  NotificationDropdownHeader,
  NotificationItem,
  NotificationContent,
  NotificationIcon,
  NotificationTimestamp,
  NotificationReadIndicator,
  NotificationFooter,
  VisitSiteLink,
  LinkIcon
} from "./NotificationDropdown.styles";
import { NotificationDropdownProps } from "./types";
import { Typography } from "../typography/Typography";

export const NotificationDropdown = (props: NotificationDropdownProps) => {
  const { notifications, onVisitSiteClick, onNotificationClick } = props;

  return (
    <NotificationDropdownContainer>
      <NotificationDropdownContent>
        <NotificationDropdownHeader>
          <Typography variant="body-medium">Notifications</Typography>
        </NotificationDropdownHeader>

        {notifications.map((notification) => (
          <NotificationItem 
            key={notification.id} 
            isRead={notification.isRead}
            onClick={() => onNotificationClick && onNotificationClick(notification.id)}
          >
            <NotificationIcon>
              F
            </NotificationIcon>
            <NotificationContent>
              <Typography variant="body-small">{notification.message}</Typography>
              <NotificationTimestamp>{notification.timestamp}</NotificationTimestamp>
            </NotificationContent>
            {!notification.isRead && <NotificationReadIndicator />}
          </NotificationItem>
        ))}

        <NotificationFooter>
          <VisitSiteLink onClick={onVisitSiteClick}>
            <Typography variant="body-small">Visit Site</Typography>
            <LinkIcon>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </LinkIcon>
          </VisitSiteLink>
        </NotificationFooter>
      </NotificationDropdownContent>
    </NotificationDropdownContainer>
  );
};

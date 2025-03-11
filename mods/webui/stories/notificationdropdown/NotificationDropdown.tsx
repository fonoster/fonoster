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
import React from "react";
import {
  NotificationDropdownContainer,
  NotificationDropdownContent,
  NotificationDropdownHeader,
  NotificationItem,
  NotificationContent,
  NotificationIcon,
  NotificationTimestamp,
} from "./NotificationDropdown.styles";
import { NotificationDropdownProps } from "./types";
import { Typography } from "../typography/Typography";

export const NotificationDropdown = (props: NotificationDropdownProps) => {
  const { notifications, onNotificationClick } = props;

  return (
    <NotificationDropdownContainer>
      <NotificationDropdownContent>
        <NotificationDropdownHeader>
          <Typography variant="body-medium">Notifications</Typography>
        </NotificationDropdownHeader>

        {notifications.length === 0 ? (
          <div style={{ padding: "16px", textAlign: "center" }}>
            <Typography variant="body-small">You're all caught up!</Typography>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              isRead={notification.isRead}
              onClick={() => onNotificationClick && onNotificationClick(notification.id)}
            >
              <NotificationIcon>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 7.5102C16 3.36243 12.4183 0 8 0C3.58172 0 0 3.36243 0 7.5102V16H7.47826C12.1847 16 16 12.4183 16 8V7.5102Z" fill="#39E19E" />
                  <path d="M5.73047 11.802V4.7207H11.212V6.15692H7.59554V7.6829H10.5751V9.0094H7.59554V11.802H5.73047Z" fill="#333333" />
                </svg>
              </NotificationIcon>
              <NotificationContent>
                <Typography variant="body-small">{notification.message}</Typography>
              </NotificationContent>
              <NotificationTimestamp>
                <Typography variant="body-micro">{notification.timestamp}</Typography>
              </NotificationTimestamp>
            </NotificationItem>
          ))
        )}
      </NotificationDropdownContent>
    </NotificationDropdownContainer>
  );
};

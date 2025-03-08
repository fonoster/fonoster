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
import { Meta, StoryObj } from "@storybook/react";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationItem } from "./types";

const meta: Meta<typeof NotificationDropdown> = {
  title: "Core Components/Notification/NotificationDropdown",
  component: NotificationDropdown,
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof NotificationDropdown>;

const mockNotifications: NotificationItem[] = [
  {
    id: "1",
    message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
    timestamp: "x hours ago",
    isRead: false
  },
  {
    id: "2",
    message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
    timestamp: "x hours ago",
    isRead: true
  },
  {
    id: "3",
    message: "Lorem ipsum dolor sit amet lorem ipsum dolor",
    timestamp: "x hours ago",
    isRead: true
  }
];

export const Default: Story = {
  args: {
    notifications: mockNotifications,
    onVisitSiteClick: () => console.log("Visit site clicked"),
    onNotificationClick: (id) => console.log(`Notification ${id} clicked`)
  }
};

export const Empty: Story = {
  args: {
    notifications: [],
    onVisitSiteClick: () => console.log("Visit site clicked")
  }
};

export const SingleNotification: Story = {
  args: {
    notifications: [mockNotifications[0]],
    onVisitSiteClick: () => console.log("Visit site clicked"),
    onNotificationClick: (id) => console.log(`Notification ${id} clicked`)
  }
};

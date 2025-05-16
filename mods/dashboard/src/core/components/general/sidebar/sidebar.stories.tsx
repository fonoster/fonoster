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
import type { Meta, StoryObj } from "@storybook/react";
import Sidebar from "./sidebar";
import { action } from "@storybook/addon-actions";
import type { Workspace } from "./sidebar.interfaces";

const meta: Meta<typeof Sidebar> = {
  title: "Components/Layouts/Sidebar",
  component: Sidebar
};

export default meta;

type Story = StoryObj<typeof Sidebar>;

const workspaces: Workspace[] = [
  { id: "1", name: "Demo Workspace" },
  { id: "2", name: "Default Workspace" },
  { id: "3", name: "Bank Account" }
];

export const Default: Story = {
  args: {
    workspaces,
    selectedWorkspaceId: "1",
    onSelectWorkspace: action("onSelectWorkspace"),
    navigate: action("navigate"),
    pathname: "/workspaces/[workspaceId]/sip-network/domains"
  }
};

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
import { NavigationDropdownAccount } from "./NavigationDropdownAccount";
import { fn } from "@storybook/test";
import React from "react";

/**
 * This story is for the Navigation Dropdown Account.
 * It takes open, onAccountSettingsClicked and onSignoutClicked.
 */
const meta = {
    title: "Core Components/Navigation/NavigationDropdownAccount",
    component: NavigationDropdownAccount,
    parameters: {
        layout: "centered",
        design: {
            type: "figma",
            url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=284-12264"
        }
    },
    tags: ["autodocs"],
    argTypes: {
        open: {
            name: "Open",
            description: "This is the open state of the dropdown"
        },
        onAccountSettingsClicked: {
            name: "OnAccountSettingsClicked",
            description: "This is onClick handler of account setting"
        },
        onSignoutClicked: {
            name: "OnSignoutClicked",
            description: "This the onClick handler of sign out"
        }
    },
    decorators: [
        (Story) => (
            <div style={{ padding: '20px' }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof NavigationDropdownAccount>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example to show NavigationDropdownAccount usage.
 */
export const Default: Story = {
    args: {
        open: true,
        onAccountSettingsClicked: fn(),
        onSignoutClicked: fn()
    }
}; 
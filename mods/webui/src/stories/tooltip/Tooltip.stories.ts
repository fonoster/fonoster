/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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

import type { Meta, StoryObj } from "@storybook/react"
import { Tooltip } from './Tooltip'
import React from 'react';

/**
 * This story is for the Tooltip Component.
 */

const meta = {
    title: "Shared Components/Tooltip",
    component: Tooltip,
    parameters: {
        layout: "centered",
        design: {
            type: "figma",
            url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=947-2396&t=FZpgQQ5oJZ2p3FGb-4"
        },
        tags: ["autodocs"],
        argTypes: {
            content: {

            }
        }
    }
} satisfies Meta<typeof Tooltip>

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example to show Tooltip
 */
export const Example: Story = {
    args: {
        content: "Request Video Call",
        placement: "top",
        children: React.createElement("div", null, "Hello, world!")
    }
}

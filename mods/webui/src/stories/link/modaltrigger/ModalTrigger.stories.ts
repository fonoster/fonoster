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
import type { Meta, StoryObj } from "@storybook/react";
import { ModalTrigger } from "./ModalTrigger";
import { fn } from "@storybook/test";

const meta = {
  title: "Shared Components/ModalTrigger",
  component: ModalTrigger,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=888-19702&t=kMSUMoNiANfbgLUK-0"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn(), children: "Back" },
  argTypes: {
    onClick: {
      name: "On Click",
      description: "Function to execute on click"
    },
    disabled: {
      name: "Disabled",
      description: "If true, the button will be disabled",
      control: "boolean"
    },
    children: {
      name: "Label",
      description: "The label to display",
      control: "text"
    }
  }
} satisfies Meta<typeof ModalTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Create New Secret",
    disabled: false
  }
};

export const Disabled: Story = {
  args: {
    children: "Create New Secret",
    disabled: true
  }
};

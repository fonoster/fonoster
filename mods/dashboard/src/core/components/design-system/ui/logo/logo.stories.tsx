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
import { Logo } from "./logo";

/**
 * This story is for the Logo component which is used for branding in the app.
 */
const meta = {
  title: "Components/Icons, Badges, & Labels/Logo",
  component: Logo,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=8-8510"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    size: {
      name: "Size",
      description: "The type of logo to render",
      control: {
        type: "select",
        options: ["micro", "large"]
      }
    }
  }
} satisfies Meta<typeof Logo>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a large logo
 */
export const LargeLogo: Story = {
  args: {
    size: "large"
  }
};

/**
 * Example of a micro logo
 */
export const MicroLogo: Story = {
  args: {
    size: "micro"
  }
};

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
import { ProgressIndicator } from "./ProgressIndicator";
import React from "react";

/**
 * This story is for the ProgressIndicator component. It takes steps, and current step.
 */
const meta = {
  title: "Core Components/Navigation/ProgressIndicator",
  component: ProgressIndicator,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=16-11665&t=9fsQpnbEFLDtU7tO-4"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    steps: {
      name: "Steps",
      description: "The list of steps"
    },
    current: {
      name: "Current",
      control: "number",
      description: "The current step"
    }
  }
} satisfies Meta<typeof ProgressIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example to show Progress Indicator.
 */
export const Example: Story = {
  args: {
    steps: [
      "Verify email address",
      "Enter phone number",
      "Verify phone number"
    ],
    current: 2
  }
};

/**
 * Example to show Progress Indicator with four steps and zero progress.
 */
export const ZeroProgress: Story = {
  args: {
    steps: [
      "Verify email address",
      "Enter phone number",
      "Verify phone number",
      "Confirmation"
    ],
    current: 0
  }
};

/**
 * Example to show Progress Indicator with four steps and half progress.
 */
export const HalfProgress: Story = {
  args: {
    steps: [
      "Verify email address",
      "Enter phone number",
      "Verify phone number",
      "Confirmation"
    ],
    current: 2
  }
};

/**
 * Example to show Progress Indicator with four steps and complete progress.
 */
export const CompleteProgress: Story = {
  args: {
    steps: [
      "Verify email address",
      "Enter phone number",
      "Verify phone number",
      "Confirmation"
    ],
    current: 4
  }
};

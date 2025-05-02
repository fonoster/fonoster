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
import { toast, Toaster } from "./toaster";
import { Button } from "../button/button";

type ToastStoryProps = {
  message: string;
  duration: number;
};

const ToastStory = ({ message, duration }: ToastStoryProps) => (
  <>
    <Toaster />
    <Button onClick={() => toast(message, { duration })}>Show Toast</Button>
  </>
);

const meta: Meta<typeof ToastStory> = {
  title: "Components/Modals & Popups/Toast",
  component: ToastStory,
  tags: ["autodocs"],
  args: {
    message: "This is a toast message",
    duration: 3000
  },
  argTypes: {
    message: {
      name: "Message",
      description: "The message shown inside the toast notification.",
      control: { type: "text" },
      table: { type: { summary: "string" } }
    },
    duration: {
      name: "Duration",
      description: "Time in milliseconds the toast stays visible.",
      control: { type: "number" },
      table: { type: { summary: "number" } }
    }
  },
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=9-9052&node-type=frame&m=dev"
    }
  }
};

export default meta;

type Story = StoryObj<typeof ToastStory>;

/**
 * Toast with configurable message, severity and duration
 */
export const ConfigurableToast: Story = {
  args: {
    message: "This is a toast message",
    duration: 3000
  }
};

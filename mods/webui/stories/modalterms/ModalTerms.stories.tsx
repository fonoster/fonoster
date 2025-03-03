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
import { ModalTerms } from "./ModalTerms";
import { fn } from "@storybook/test";
import { DemoWrapper } from "./DemoWrapper";
import React from "react";

/**
 * This story is for the Terms and Conditions Modal component based on Material UI.
 */
const meta = {
  title: "Core Components/Modals and Popups/ModalTerms",
  component: ModalTerms,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=23-4218&t=OHxjKnUMu9QS80uR-0"
    }
  },
  tags: ["autodocs"],
  args: {
    message:
      "Your API Key was successfully generated and has been copied to your keyboard.",
    open: true,
    onClose: fn()
  },
  argTypes: {
    title: {
      name: "Title",
      description: "The title to display in the terms modal",
      control: "text"
    },
    message: {
      name: "Message",
      description: "The message to display in the terms modal",
      control: "text"
    },
    open: {
      name: "Open",
      description: "Controls the visibility of the terms modal",
      control: "boolean"
    },
    onClose: {
      name: "On Close",
      description: "Function to call when terms modal is closed"
    }
  }
} satisfies Meta<typeof ModalTerms>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default Terms Modal
 */
export const TermsModal: Story = {
  render: () => <DemoWrapper />
};

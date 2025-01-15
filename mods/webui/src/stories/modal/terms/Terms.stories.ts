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
import { Terms } from "./Terms";
import { fn } from "@storybook/test";

/**
 * This story is for the Terms and Conditions Modal component based on Material UI.
 */
const meta = {
  title: "Shared Components/Modal/Terms",
  component: Terms,
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
} satisfies Meta<typeof Terms>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default Terms Modal
 */
export const TermsModal: Story = {
  args: {
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
  }
};

/**
 * Terms Modal Open
 */
export const TermsModalOpen: Story = {
  args: {
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    open: true
  }
};

/**
 * Terms Modal Not Open
 */
export const TermsModalNotOpen: Story = {
  args: {
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    open: false
  }
};

/**
 * Terms Modal with onClose function
 */
export const WithOnClose: Story = {
  args: {
    message:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    open: true,
    onClose: fn()
  }
};

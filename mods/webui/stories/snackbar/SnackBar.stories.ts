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
import { Snackbar } from "./SnackBar";
import { action } from "@storybook/addon-actions";
import React from "react";

/**
 * This story is for the Snackbar component based on Material UI.
 * It demonstrates different positions and behavior of the snackbar.
 */
const meta = {
  title: "Core Components/Modals and Popups/Snackbar",
  component: Snackbar,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-34326&t=PCa7qoqJ5LyNWGvX-0"
    }
  },
  tags: ["autodocs"],
  args: {
    message:
      "Your API Key was successfully generated and has been copied to your keyboard.",
    open: true,
    position: "top-center",
    onClose: action("Snackbar closed"),
    autoHideDuration: 5000
  },
  argTypes: {
    message: {
      name: "Message",
      description: "The message to display in the snackbar",
      control: "text"
    },
    open: {
      name: "Open",
      description: "Controls the visibility of the snackbar",
      control: "boolean"
    },
    onClose: {
      name: "On Close",
      description: "Function to call when snackbar is closed"
    },
    position: {
      name: "Position",
      description: "The position of the snackbar",
      control: {
        type: "select",
        options: [
          "top-center",
          "top-right",
          "top-left",
          "bottom-center",
          "bottom-right",
          "bottom-left"
        ]
      }
    },
    autoHideDuration: {
      name: "Auto-hide Duration",
      description: "Time (in ms) before the snackbar hides automatically",
      control: { type: "number" }
    }
  }
} satisfies Meta<typeof Snackbar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default snackbar positioned at the top center
 */
export const TopCenter: Story = {
  args: {
    position: "top-center"
  }
};

/**
 * Snackbar positioned at the top-right corner
 */
export const TopRight: Story = {
  args: {
    position: "top-right"
  }
};

/**
 * Snackbar positioned at the top-left corner
 */
export const TopLeft: Story = {
  args: {
    position: "top-left"
  }
};

/**
 * Snackbar positioned at the bottom-center corner
 */
export const BottomCenter: Story = {
  args: {
    position: "bottom-center"
  }
};

/**
 * Snackbar positioned at the bottom-right corner
 */
export const BottomRight: Story = {
  args: {
    position: "bottom-right"
  }
};

/**
 * Snackbar positioned at the bottom-left corner
 */
export const BottomLeft: Story = {
  args: {
    position: "bottom-left"
  }
};

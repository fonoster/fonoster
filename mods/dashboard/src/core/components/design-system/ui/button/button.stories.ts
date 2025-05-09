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
import { action } from "@storybook/addon-actions";
import { Button } from "./button";
import React from "react";

const meta = {
  title: "Components/Buttons, & Links/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    type: "button",
    variant: "contained",
    size: "large",
    disabled: false,
    isFullWidth: false,
    children: "Button Copy"
  },
  argTypes: {
    variant: {
      name: "Variant",
      description:
        "Based on the Fonoster design system, the variant prop determines the color and style of the button.",
      control: { type: "select" },
      table: {
        defaultValue: {
          summary: "contained"
        }
      },
      options: ["contained", "outlined"]
    },
    size: {
      name: "Size",
      description:
        "The size prop determines the height and padding of the button.",
      control: { type: "select" },
      options: ["large", "small"],
      table: {
        defaultValue: {
          summary: "large"
        }
      }
    },
    disabled: {
      name: "Disabled",
      description: "When true, the button will be disabled.",
      control: { type: "boolean" },
      table: {
        defaultValue: {
          summary: "false"
        }
      }
    },
    isFullWidth: {
      name: "Full Width",
      description:
        "When true, the button will take up the full width of its container.",
      control: { type: "boolean" },
      table: {
        defaultValue: {
          summary: "false"
        }
      }
    },
    children: {
      name: "Content",
      description: "The content of the button.",
      control: { type: "text" },
      table: {
        defaultValue: {
          summary: "Button Copy"
        }
      },
      type: "string"
    },
    type: {
      name: "Type",
      description:
        "The type prop determines the type of the button. This is useful for form submission buttons.",
      control: { type: "select" },
      options: ["button", "submit", "reset"],
      table: {
        defaultValue: {
          summary: "button"
        }
      }
    }
  },
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=9-9052&node-type=frame&m=dev"
    }
  }
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Primary Button used for primary actions and CTAs
 */
export const PrimaryVariantButton: Story = {
  args: {
    variant: "contained",
    children: "Button Copy",
    onClick: action("onClick")
  }
};

/**
 * Outline Button used for secondary actions or as a secondary CTA
 */
export const OutlineVariantButton: Story = {
  args: {
    variant: "outlined",
    children: "Button Copy",
    onClick: action("onClick")
  }
};

/**
 * Icon Button, used for actions that require an icon for better understanding
 */
export const WithIconButton: Story = {
  args: {
    variant: "contained",
    onClick: action("onClick"),
    children: "Button Copy",
    endIcon: React.createElement(
      "svg",
      { viewBox: "0 0 24 24", width: 14, height: 14 },
      React.createElement("path", {
        d: "M12 5v14M5 12h14",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2
      })
    )
  }
};

/**
 * Large Button used for actions that require more attention or are more important
 */
export const SizeLargeButton: Story = {
  args: {
    size: "large",
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Small Button used for actions that require less attention or are less important
 */
export const SizeSmallButton: Story = {
  args: {
    size: "small",
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Disabled Button used for actions that are not available or possible at the moment
 */
export const DisabledButton: Story = {
  args: {
    variant: "contained",
    disabled: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Full Width Button used for actions that require more attention or are more important
 */
export const FullWidthButton: Story = {
  args: {
    isFullWidth: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Full Width Outline Button used for actions that require more attention or are more important
 */
export const FullWidthButtonWithIcon: Story = {
  args: {
    isFullWidth: true,
    variant: "contained",
    onClick: action("onClick"),
    children: "Button Copy",
    endIcon: React.createElement(
      "svg",
      { viewBox: "0 0 24 24", width: 16, height: 16 },
      React.createElement("path", {
        d: "M12 5v14M5 12h14",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2
      })
    )
  }
};

/**
 * Full Width Disabled Button used for actions that are not available or possible at the moment
 */
export const FullWidthDisabledButton: Story = {
  args: {
    isFullWidth: true,
    disabled: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

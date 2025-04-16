import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Button } from "./button";
import React from "react";

const meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    onClick: action("onClick"),
    type: "button",
    className: ""
  },
  argTypes: {
    onClick: {
      name: "onClick",
      description: "The function to call when the button is clicked.",
      action: "onClick",
      table: {
        type: {
          summary: "function"
        }
      }
    },
    variant: {
      name: "Variant",
      description:
        "Based on the Fonoster design system, the variant prop determines the color and style of the button.",
      control: { type: "select" },
      table: {
        defaultValue: {
          summary: "primary"
        }
      },
      options: ["primary", "outline"]
    },
    size: {
      name: "Size",
      description:
        "The size prop determines the height and padding of the button.",
      control: { type: "select" },
      options: ["default", "sm", "lg"],
      table: {
        defaultValue: {
          summary: "default"
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
    isFull: {
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
    className: {
      name: "CSS Class",
      description: "Additional CSS classes to apply to the button.",
      control: { type: "text" },
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
    variant: "primary",
    children: "Button Copy",
    onClick: action("onClick")
  }
};

/**
 * Outline Button used for secondary actions or as a secondary CTA
 */
export const OutlineVariantButton: Story = {
  args: {
    variant: "outline",
    children: "Button Copy",
    onClick: action("onClick")
  }
};

/**
 * Icon Button, used for actions that require an icon for better understanding
 */
export const WithIconButton: Story = {
  args: {
    variant: "primary",
    onClick: action("onClick"),
    children: [
      "Button Copy",
      React.createElement(
        "svg",
        { viewBox: "0 0 24 24", width: 14, height: 14 },
        React.createElement("path", {
          d: "M12 5v14M5 12h14",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2
        })
      )
    ]
  }
};

/**
 * Large Button used for actions that require more attention or are more important
 */
export const SizeLargeButton: Story = {
  args: {
    size: "lg",
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Small Button used for actions that require less attention or are less important
 */
export const SizeSmallButton: Story = {
  args: {
    size: "sm",
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Disabled Button used for actions that are not available or possible at the moment
 */
export const DisabledButton: Story = {
  args: {
    variant: "primary",
    isDisabled: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Full Width Button used for actions that require more attention or are more important
 */
export const FullWidthButton: Story = {
  args: {
    isFull: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

/**
 * Full Width Disabled Button used for actions that are not available or possible at the moment
 */
export const FullWidthDisabledButton: Story = {
  args: {
    isFull: true,
    isDisabled: true,
    onClick: action("onClick"),
    children: "Button Copy"
  }
};

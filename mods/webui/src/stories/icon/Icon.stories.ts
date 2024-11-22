import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";

/**
 * This story is for the Icon component based on Material UI.
 * It can be used to display icons in the application with different sizes.
 */
const meta = {
  title: "Shared Components/Icon",
  component: Icon,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=284-10528"
    }
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      name: "Icon Name",
      description: "The icon to display",
      control: {
        type: "select"
      },
      defaultValue: "Add"
    },
    fontSize: {
      name: "Font Size",
      description: "The size of the icon",
      control: {
        type: "select",
        options: ["small", "medium", "large"]
      },
      defaultValue: "medium"
    }
  }
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Example of an icon with the name "Add" and a medium font size.
 */
export const PlusIcon: Story = {
  args: {
    name: "Add",
    fontSize: "medium"
  }
};


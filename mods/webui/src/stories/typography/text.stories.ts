import { Meta, StoryObj } from "@storybook/react";
import { FTypography } from "./Typography";

const meta = {
  title: "Shared Components/Typography",
  component: FTypography,
  argTypes: {
  },
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof FTypography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
  }
};

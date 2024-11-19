import { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./Typography";

const meta = {
  title: "Shared Components/Typography",
  component: Typography,
  argTypes: {},
  parameters: {
    layout: "centered"
  }
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

export const H1: Story = {
  args: {
    variant: "heading-large",
    text: "Heading/Large"
  }
};

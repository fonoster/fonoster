import type { Meta, StoryObj } from '@storybook/react';

import SearchIcon from '@mui/icons-material/Search';

import InputAdornment from '@mui/material/InputAdornment';
import InputExample from './Input';
import React from 'react';

/**
 * This story is for the Input component based on Material UI.
 * It has a Input with optional label and can be in a checked or disabled state.
 */
const meta: Meta<typeof InputExample> = {
  title: "Shared Components/Input",
  component: InputExample,
  parameters: {
    layout: "padded",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=276-26538&m=dev"
    }
  },
  args: {
    "aria-label": "Input",
  },
  tags: ["autodocs"],
  argTypes: {
    onClick: {
      name: "onClick",
      description: "Function to execute on click"
    },
    label: {
      name: "label",
      description: "Label for the input"
    },
  }
};

export default meta;

type Story = StoryObj<typeof InputExample>;

/**
 * Example of an Input Field.
 */
export const Input: Story = {
  args: {
    //👇 The args you need here will depend on your component
    onChange: () => console.log("onChange"),
    label: "",
    onClick: () => console.log("onClick"),
  },
};

/**
 * Example of an Input field with Icon
 * 
 */
export const InputIcon: Story = {
  args: {
    label: "outlined",
    slotProps: {
      input: {
        startAdornment: React.createElement(InputAdornment, { position: "start" }, React.createElement(SearchIcon)),
      },
    },
  },
};
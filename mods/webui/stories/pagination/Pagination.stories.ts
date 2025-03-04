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
import { Pagination } from "./Pagination";
import { fn } from "@storybook/test";
import React from "react";

/**
 *  Story of the Pagination component.
 */
const meta = {
  title: "Core Components/Buttons, Links, and Chips/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    design: {
      type: "figma",
      url: "https://www.figma.com/design/OsZlne0RvIgoFlFKF7hnAU/Shared-Component-Library?node-id=888-19707&t=7iBONnPS49mz6HuU-4"
    }
  },
  tags: ["autodocs"],
  args: { onClick: fn() },
  argTypes: {
    count: {
      name: "Count",
      description: "Count of the total number of items",
      control: "number"
    },
    disabled: {
      name: "Disabled",
      description: "If true, pagination will be disable",
      control: "boolean"
    },
    rowsPerPage: {
      name: "Rows per page",
      description: "Rows per page",
      control: "number"
    }
  }
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Example of a Pagination with the count of 32
 * and default rowsPerPage of 10
 */
export const Default: Story = {
  args: {
    count: 32,
    disabled: false
  }
};

/**
 *  Example of Pagination Component with the count of 4269
 * and explicit rowsPerPage of 69
 */
export const WithExplicitOnPage: Story = {
  args: {
    count: 4269,
    disabled: false,
    rowsPerPage: 69
  }
};

/**
 * Example of disabled pagination component
 */
export const Disable: Story = {
  args: {
    count: 100,
    disabled: true
  }
};

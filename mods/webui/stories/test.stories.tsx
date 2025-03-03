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
import React from "react";

// Simple test component
const TestComponent = ({ text }: { text: string }) => {
  return <div style={{ padding: "20px", border: "1px solid #ccc" }}>{text}</div>;
};

const meta = {
  title: "Test/TestComponent",
  component: TestComponent,
  parameters: {
    layout: "padded"
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "Text to display"
    }
  }
} satisfies Meta<typeof TestComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    text: "This is a test component"
  }
};

export const WithLongText: Story = {
  args: {
    text: "This is a test component with a longer text to test wrapping and layout"
  }
};

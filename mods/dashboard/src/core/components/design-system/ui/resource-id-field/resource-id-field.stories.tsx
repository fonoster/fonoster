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
import { ResourceIdField } from "./resource-id-field";

const meta = {
  title: "Components/Forms/ResourceIdField",
  component: ResourceIdField,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A read-only input field for displaying resource IDs with built-in copy functionality. Perfect for edit forms where users need to reference or copy the resource identifier."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      name: "Value",
      description: "The resource ID/ref value to display",
      control: { type: "text" }
    },
    label: {
      name: "Label",
      description: "Label for the field",
      control: { type: "text" }
    },
    showCopyIcon: {
      name: "Show Copy Icon",
      description: "Whether to show the copy icon",
      control: { type: "boolean" }
    }
  }
} satisfies Meta<typeof ResourceIdField>;

export default meta;

type Story = StoryObj<typeof meta>;

// --- Stories ---

export const Default: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Agent ID"
  }
};

export const WithSupportingText: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Trunk ID"
  }
};

export const SmallSize: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Resource ID"
  }
};

export const WithLeadingIcon: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Agent ID"
  }
};

export const WithoutCopyIcon: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Resource ID",
    showCopyIcon: false
  }
};

export const LongValue: Story = {
  args: {
    value:
      "very-long-resource-identifier-that-might-overflow-the-input-field-width-in-some-cases",
    label: "Long Resource ID"
  }
};

export const DifferentResourceTypes: Story = {
  args: {
    value: "TKc0aff3ae2070ab13b79a2b87b8c46f41",
    label: "Resource ID"
  },
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        maxWidth: "400px"
      }}
    >
      <ResourceIdField value="AG-abc123def456" label="Agent ID" />
      <ResourceIdField value="TK-xyz789uvw012" label="Trunk ID" />
      <ResourceIdField value="DM-domain123456" label="Domain ID" />
      <ResourceIdField value="CR-cred987654321" label="Credential ID" />
    </div>
  )
};

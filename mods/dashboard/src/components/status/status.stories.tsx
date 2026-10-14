/**
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
import { fn } from "@storybook/test";
import { ApiUnreachable, ConfigError } from "./boot-error";
import { Splash } from "./splash";

const meta = { title: "Status/Boot" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = { render: () => <Splash /> };

export const NotConfigured: Story = {
  render: () => <ConfigError error="DASHBOARD_API_URL is not set" />
};

export const ApiDown: Story = {
  render: () => (
    <ApiUnreachable apiUrl="https://api.example.com" onRetry={fn()} />
  )
};

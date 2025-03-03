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
import { Meta, StoryObj } from "@storybook/react";
import { Typography } from "./Typography";
import React from "react";

const meta = {
  title: "Core Components/Icons, Badges, and Labels/Typography",
  component: Typography,
  argTypes: {},
  parameters: {
    layout: "centered"
  },
  tags: ["autodocs"]
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Body/Large.
 */
export const BodyLarge: Story = {
  args: {
    variant: "body-large",
    children: "Body/Large"
  }
};

/**
 * Body/Medium.
 */
export const BodyMedium: Story = {
  args: {
    variant: "body-medium",
    children: "Body/Medium"
  }
};

/**
 * Body/Micro.
 */
export const BodyMicro: Story = {
  args: {
    variant: "body-micro",
    children: "Body/Micro"
  }
};

/**
 * Body/Small.
 */
export const BodySmall: Story = {
  args: {
    variant: "body-small",
    children: "Body/Small"
  }
};

/**
 * Body/Small Underline.
 */
export const BodySmallUnderline: Story = {
  args: {
    variant: "body-small-underline",
    children: "Body/Small Underline"
  }
};

/**
 * Drawer Label.
 */
export const DrawerLabel: Story = {
  args: {
    variant: "drawer-label",
    children: "Drawer Label"
  }
};

/**
 * Drawer Title.
 */
export const DrawerTitle: Story = {
  args: {
    variant: "drawer-title",
    children: "Drawer Title"
  }
};

/**
 * Heading/Large.
 */
export const HeadingLarge: Story = {
  args: {
    variant: "heading-large",
    children: "Heading/Large"
  }
};

/**
 * Heading/Medium.
 */
export const HeadingMedium: Story = {
  args: {
    variant: "heading-medium",
    children: "Heading/Medium"
  }
};

/**
 * Heading/Small.
 */
export const HeadingSmall: Story = {
  args: {
    variant: "heading-small",
    children: "Heading/Small"
  }
};

/**
 * Mono/Medium.
 */
export const MonoMedium: Story = {
  args: {
    variant: "mono-medium",
    children: "Mono/Medium"
  }
};

/**
 * Mono/Medium Underline.
 */
export const MonoMediumUnderline: Story = {
  args: {
    variant: "mono-medium-underline",
    children: "Mono/Medium Underline"
  }
};

/**
 * Mono/Small.
 */
export const MonoSmall: Story = {
  args: {
    variant: "mono-small",
    children: "Mono/Small"
  }
};

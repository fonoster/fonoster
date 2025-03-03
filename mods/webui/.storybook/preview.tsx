import type { Preview } from "@storybook/react";
import React from "react";
import { MainProvider } from "../stories/main";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    options: {
      storySort: {
        order: ["Introduction", "Brand Identity", "Shared Components"],
        includeName: true
      }
    }
  }
};

export const decorators = [
  (Story) => (
    <MainProvider>
      <Story />
    </MainProvider>
  ),
];

export default preview;

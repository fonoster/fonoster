import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "../src/core/providers/styling/mui.provider";

const preview: Preview = {
  parameters: {
    layout: "centered",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    previewTabs: { "storybook/docs/panel": { index: -1 } },
    options: {
      storySort: {
        order: ["Introduction", "Brand Identity", "Typography"],
        includeName: true
      }
    }
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    )
  ]
};

export default preview;

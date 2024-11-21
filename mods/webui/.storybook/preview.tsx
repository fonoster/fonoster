import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { fnLight } from "../src/theme.ts";

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
    <ThemeProvider theme={fnLight}>
      <CssBaseline />
      <Story />
    </ThemeProvider>
  ),
];

export default preview;

import type { Preview } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";

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
    withThemeByClassName({
      themes: {
        light: "light",
        dark: "dark"
      },
      defaultTheme: "light"
    })
  ]
};

export default preview;

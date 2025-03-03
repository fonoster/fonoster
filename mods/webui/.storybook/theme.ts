import { create } from "@storybook/theming/create";

export default create({
  base: "light",
  // Typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: "monospace",

  brandTitle: "Fonoster Design System",
  brandUrl: "https://fonoster.com",
  brandImage: "/images/logo.svg",
  brandTarget: "_self",

  // Primary colors
  colorPrimary: "#39e19e",
  colorSecondary: "#053204",

  // UI
  appBg: "#ffffff",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#10162F",
  appBorderRadius: 4,

  // Text colors
  textColor: "#053204",
  textInverseColor: "#ffffff",

  // Toolbar default and active colors
  barTextColor: "#053204",
  barSelectedColor: "#053204",
  barHoverColor: "#39e19e",
  barBg: "#ffffff",

  // Form colors
  inputBg: "#ffffff",
  inputBorder: "#10162F",
  inputTextColor: "#053204",
  inputBorderRadius: 2
});
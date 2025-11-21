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
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
    "@storybook/addon-docs",
    "@storybook/addon-designs",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        viteConfigPath: "./.storybook/vite.config.ts",
      },
    },
  },
  viteFinal: async (config, { configType }) => {
    const { mergeConfig } = await import("vite");
    const tsconfigPaths = (await import("vite-tsconfig-paths")).default;
    
    return mergeConfig(config, {
      plugins: [
        tsconfigPaths({
          projects: ["./tsconfig.json"]
        }),
      ],
      resolve: {
        alias: {
          // Stub out React Router completely
          "react-router": require.resolve("./stubs/react-router.js"),
          "@react-router/dev": require.resolve("./stubs/react-router-dev.js"),
          "@react-router/node": "data:text/javascript,export default {};",
          "@react-router/serve": "data:text/javascript,export default {};",
          "react-router-devtools": "data:text/javascript,export default {};",
        },
      },
      define: {
        "global": "globalThis",
      },
      optimizeDeps: {
        include: [
          "@emotion/react", 
          "@emotion/styled", 
          "@mui/material",
          "@mui/icons-material",
          "@tanstack/react-query",
        ],
        exclude: [
          "react-router",
          "@react-router/dev",
          "@react-router/node", 
          "@react-router/serve",
          "react-router-devtools"
        ],
      },
    });
  },
  typescript: {
    check: false,
    reactDocgen: "react-docgen-typescript",
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  docs: {
    autodocs: "tag",
  },
  managerHead: (head) => `
    ${head}
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  `,
};

export default config;
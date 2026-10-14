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
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Storybook-specific Vite config without React Router
export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: ["./tsconfig.json"]
    })
  ],
  resolve: {
    alias: {
      "react-router": "react-router/dist/react-router.production.min.js",
    },
  },
  optimizeDeps: {
    include: [
      "@emotion/react", 
      "@emotion/styled", 
      "@mui/material",
      "@mui/icons-material",
      "@tanstack/react-query",
      "react",
      "react-dom"
    ],
    exclude: [
      "@react-router/dev",
      "@react-router/node", 
      "@react-router/serve",
      "react-router-devtools"
    ],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
});
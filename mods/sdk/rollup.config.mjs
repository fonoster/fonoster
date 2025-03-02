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
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

const webConfig = {
  input: "src/web.ts",
  output: [
    {
      file: "dist/web/fonoster.min.js",
      format: "umd",
      name: "SDK",
      exports: "auto"
    },
    {
      file: "dist/web/index.esm.js",
      format: "es"
    }
  ],
  plugins: [
    replace({
      "process.env.NODE_ENV": JSON.stringify("browser"),
      preventAssignment: true
    }),
    typescript({
      tsconfig: "./tsconfig.web.json",
      exclude: ["src/client/Client.ts", "src/generated/node/*"]
    }),
    commonjs(),
    resolve({
      browser: true
    }),
    terser({
      format: {
        comments: false
      }
    })
  ]
};

export default [webConfig];

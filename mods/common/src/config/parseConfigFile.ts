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
import { extname } from "path";
import {
  ParseError,
  parse as parseJsonc,
  printParseErrorCode
} from "jsonc-parser";
import { parse as parseYaml } from "yaml";

const YAML_EXTENSIONS = [".yaml", ".yml"];
const JSON_EXTENSIONS = [".json", ".jsonc"];
const CONFIG_EXTENSIONS = [...YAML_EXTENSIONS, ...JSON_EXTENSIONS];

function lineAndColumn(text: string, offset: number) {
  const before = text.slice(0, offset);
  const line = before.split("\n").length;
  const column = offset - before.lastIndexOf("\n");
  return { line, column };
}

/**
 * Parses a config file's text. The extension picks the format: `.yaml`/`.yml`
 * as YAML, `.json`/`.jsonc` as JSON with comments and trailing commas.
 */
function parseConfigFile(path: string, text: string): unknown {
  const extension = extname(path).toLowerCase();

  if (YAML_EXTENSIONS.includes(extension)) {
    return parseYaml(text) ?? {};
  }

  if (JSON_EXTENSIONS.includes(extension)) {
    const errors: ParseError[] = [];
    const value = parseJsonc(text, errors, {
      allowTrailingComma: true,
      disallowComments: false
    });

    if (errors.length > 0) {
      const first = errors[0];
      const { line, column } = lineAndColumn(text, first.offset);
      throw new Error(
        `${printParseErrorCode(first.error)} at line ${line}, column ${column}`
      );
    }

    return value ?? {};
  }

  throw new Error(
    `unsupported extension "${extension}" (use ${CONFIG_EXTENSIONS.join(", ")})`
  );
}

export { parseConfigFile, CONFIG_EXTENSIONS };

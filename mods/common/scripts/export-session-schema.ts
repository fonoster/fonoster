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
// Writes schema/session.v1.json from src/session/schema.ts. Run after changing a message schema;
// test/session/schema.test.ts fails while the file is out of date.
import * as fs from "fs";
import * as path from "path";
import { sessionProtocolDocument } from "../src/session/schema";

const out = path.join(__dirname, "..", "schema", "session.v1.json");
fs.writeFileSync(
  out,
  JSON.stringify(sessionProtocolDocument(), null, 2) + "\n"
);
console.log(`wrote ${path.relative(process.cwd(), out)}`);

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
import { expect } from "chai";

// prisma-field-encryption reads Prisma's DMMF with zod when the extension is built; under the
// root override it runs on zod 4 (#1224). Building the client connects to nothing.

describe("@apiserver[core/db]", function () {
  it("builds the Prisma client with field encryption", async function () {
    const { prisma } = await import("../../src/core/db");
    expect(prisma.application.findUnique).to.be.a("function");
  });
});

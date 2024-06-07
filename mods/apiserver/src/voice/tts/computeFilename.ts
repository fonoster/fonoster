/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import crypto from "crypto";
import { flattenObject } from "./flattenObject";

function computeFilename(params: {
  text: string;
  options: Record<string, unknown>;
  format: "wav" | "sln16";
  cachingFields?: string[];
}) {
  const { text, options, format } = params;
  const { cachingFields } = options as { cachingFields: string[] };
  let c = "";

  if (cachingFields?.length > 0) {
    const flatObj = flattenObject(options);
    c = cachingFields
      .map((opt: string) => flatObj[opt])
      .sort()
      .join();
  }

  return (
    crypto.createHash("md5").update(`${text}${c}`).digest("hex") + "." + format
  );
}

export { computeFilename };

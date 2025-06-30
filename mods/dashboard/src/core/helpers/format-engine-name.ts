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
import { toTitleCase } from "./to-title-case";

/**
 * Formats an engine name by removing a prefix and applying toTitleCase.
 * Returns '-' if the productRef is missing.
 *
 * @param productRef - The product reference to format.
 * @param prefix - The prefix to remove from the product reference (e.g. "tts.", "stt.", "llm.").
 * @returns The formatted engine name, or '-' if the productRef is missing.
 */
export function formatEngineName(
  productRef: string | undefined,
  prefix: string
): string {
  if (!productRef) return "-";
  return toTitleCase(productRef.replace(prefix, ""));
}

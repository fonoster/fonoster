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

/**
 * Safely retrieves a nested value from an object using a dot-separated key string.
 *
 * @param obj - The object to extract the value from.
 * @param key - A dot-separated key string, e.g. "speechToText.productRef".
 * @returns The value at the specified path, or undefined if not found.
 */
export function getNestedValue(obj: Record<string, any>, key: string): any {
  return key.split(".").reduce((acc, part) => acc?.[part], obj);
}

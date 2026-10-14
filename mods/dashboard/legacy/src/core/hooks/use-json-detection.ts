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
import { useCallback } from "react";

/**
 * Custom hook that provides a utility function to determine
 * whether a given string is valid JSON.
 *
 * This is particularly useful for validating user input in forms,
 * or when toggling between "text" and "json" modes in a UI.
 *
 * @returns {function} A memoized function that takes a string and returns:
 * - `true` if the string is valid JSON and contains at least one property.
 * - `false` if the string is not valid JSON or is empty.
 */
export function useJsonDetection() {
  /**
   * Checks if the given string value is a valid JSON object.
   *
   * @param value - The string to check.
   * @returns {boolean} True if valid JSON with at least one key; false otherwise.
   */
  return useCallback((value: string): boolean => {
    try {
      const json = JSON.parse(value);
      return Boolean(json && Object.keys(json).length > 0);
    } catch {
      return false;
    }
  }, []);
}

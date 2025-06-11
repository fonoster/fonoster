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
export const getAvatar = (name: string): string => {
  if (!name) return "UN"; // Default to "UN" if name is empty

  const cleanName = name
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  const words = cleanName.split(" ");

  let firstLetter = "";
  let secondLetter = "";

  if (words.length >= 2) {
    firstLetter = words[0].charAt(0).toUpperCase();
    secondLetter = words[1].charAt(0).toUpperCase();
  } else if (words.length === 1) {
    const word = words[0];
    firstLetter = word.charAt(0).toUpperCase();
    secondLetter = word.charAt(1)?.toUpperCase() || "N";
  }

  return `${firstLetter}${secondLetter || "N"}`;
};

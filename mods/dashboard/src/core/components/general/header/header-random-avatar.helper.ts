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
export const getInitials = (name: string): string => {
  if (!name?.trim()) return "UN";

  const sanitized = name
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  const [firstWord = "", secondWord = ""] = sanitized.split(" ");

  const firstLetter = firstWord.charAt(0).toUpperCase();
  const secondLetter = secondWord
    ? secondWord.charAt(0).toUpperCase()
    : firstWord.charAt(1)?.toUpperCase() || "N";

  return `${firstLetter}${secondLetter}`;
};


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
 * lim

/**
 * Returns the last segment of a dash-separated UUID string.
 * If no dash is found, returns the original string.
 * 
 * @param str - The string to extract the last segment from.
 * @returns The last segment of the string, or the original string if no dash is found.
 */
export function lastUuidSegment(str: string): string {
  return str ? str.split("-").pop() || str : "";
}

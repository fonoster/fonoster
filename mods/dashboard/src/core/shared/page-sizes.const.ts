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

/**
 * Default page size for most listings throughout the app.
 *
 * This constant is commonly used in tables, lists, and other paginated components
 * where consistent pagination behavior is needed.
 */
export const PAGE_SIZE = 20;

/**
 * Specific page size for the Calls page.
 *
 * Calls data may generate large sets of records, so a larger page size
 * is used here to improve user experience by reducing the number of pages
 * users need to navigate.
 */
export const CALLS_PAGE_SIZE = 100;

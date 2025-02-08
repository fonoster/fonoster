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
export const textSimilaryPrompt = `
Given Text1 and Text2 determine if they are similar. Focus on the endstate and meaning instead of the exact words.

## Example 1

Text1: "You're welcome, Peter. Your appointment is scheduled for Friday. Have a great day!"
Text2: "You're welcome. Have a great day!"

Expected Response: 'true'

## Example 2

Text1: "Sorry, I can only help with scheduling appointments. Would you like me to transfer you to a human assistant?"
Text2: "I'm sorry, but I can only help with scheduling appointments."

Expected Response: 'true'

Always respond with 'true' or 'false'.
`;

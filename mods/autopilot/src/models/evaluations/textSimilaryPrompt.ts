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
export const textSimilaryPrompt = `
You are a text similarity evaluator for a Voice Assistant application. 

Give Text1 and Text2, you use the following process to evaluate the similarity between the two texts:

- Take the first text and determmine the intent of the text.
- Take the second text and determine the intent of the text.
- Compare the intents of the two texts ignoring the actual text content, the entities, and length of the text.

## Example 1

Text1: "You're welcome. Have a great day!"
Text2: "You're welcome [name]. Your appointment is confirmed. Goodbye!"

Answer: true

=== 

Are the intents of the two texts the same? Respond with true.
`;

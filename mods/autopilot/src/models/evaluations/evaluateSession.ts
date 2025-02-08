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
import { LanguageModel } from "../types";
import { ExpectedTextType } from "./types";

export async function evaluateSession(
  session: any,
  languageModel: LanguageModel,
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>
): Promise<void> {
  for (const step of session.conversation) {
    console.log(`User: ${step.userInput}`);

    let response;

    try {
      response = await languageModel.invoke(step.userInput);
    } catch (error) {
      throw new Error(
        `Language model error for input "${step.userInput}": ${error}`
      );
    }

    const expectedText = step.expected.text.response;
    const expectedType = step.expected.text.type;

    if (expectedType === ExpectedTextType.EXACT) {
      if (response.content !== expectedText) {
        throw new Error(
          `Session "${session.id}" failed at input "${step.userInput}". Expected exact response "${expectedText}", but got "${response.text}".`
        );
      }
    } else if (expectedType === ExpectedTextType.SIMILAR) {
      const isSimilar = await testTextSimilarity(
        expectedText,
        response.content
      );

      if (!isSimilar) {
        throw new Error(
          `Session "${session.id}" failed at input "${step.userInput}". Expected an similar response to "${expectedText}", but got "${response.text}".`
        );
      }
    }

    if (step.expected.functions && step.expected.functions.length > 0) {
      if (
        !response.functions ||
        response.functions.length !== step.expected.functions.length
      ) {
        throw new Error(
          `Session "${session.id}" failed at input "${step.userInput}". Expected ${step.expected.functions.length} function(s), but got ${
            response.functions ? response.functions.length : 0
          }.`
        );
      }

      for (let i = 0; i < step.expected.functions.length; i++) {
        const expectedFunc = step.expected.functions[i];
        const actualFunc = response.functions[i];

        if (actualFunc.tool !== expectedFunc.tool) {
          throw new Error(
            `Session "${session.id}" failed at input "${step.userInput}". Expected function tool "${expectedFunc.tool}" but got "${actualFunc.tool}".`
          );
        }

        if (
          JSON.stringify(actualFunc.parameters) !==
          JSON.stringify(expectedFunc.parameters)
        ) {
          throw new Error(
            `Session "${session.id}" failed at input "${step.userInput}". Expected parameters ${JSON.stringify(
              expectedFunc.parameters
            )}, but got ${JSON.stringify(actualFunc.parameters)}.`
          );
        }
      }
    }
  }
}

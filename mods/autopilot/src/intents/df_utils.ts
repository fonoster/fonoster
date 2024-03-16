/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/rox
 *
 * This file is part of Rox AI
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
import { Effect } from "../cerebro/types";

function deserializePayload(object: Record<string, any>): any {
  const outputMessage = Array.isArray(object) ? [] : {};
  Object.entries(object).forEach(([key, value]) => {
    if (value.kind == "structValue") {
      outputMessage[key] = deserializePayload(value.structValue.fields);
    } else if (value.kind == "listValue") {
      outputMessage[key] = deserializePayload(value.listValue.values);
    } else if (value.kind == "stringValue") {
      outputMessage[key] = value.stringValue;
    } else if (value.kind == "boolValue") {
      outputMessage[key] = value.boolValue;
    } else {
      outputMessage[key] = value;
    }
  });
  return outputMessage as any;
}

export function getRamdomValue(values: Record<string, string>[]) {
  return values[Math.floor(Math.random() * values.length)];
}

export function transformPayloadToEffect(payload: Record<string, any>): Effect {
  const o = deserializePayload(payload.fields);
  const parameters =
    o.effect === "say"
      ? { response: getRamdomValue(o.parameters.responses) }
      : o.parameters;
  return {
    type: o.effect,
    parameters
  };
}

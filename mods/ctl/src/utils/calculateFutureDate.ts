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
import moment from "moment";

function calculateFutureDate(input: string): Date {
  const value = parseInt(input, 10);
  const unit = input.replace(/\d/g, "").toLowerCase(); // Extract the unit (d, mo)

  switch (unit) {
    case "d":
      return moment().add(value, "days").toDate();
    case "mo":
      return moment().add(value, "months").toDate();
    default:
      throw new Error(
        `Invalid unit: ${unit}. Use 'd' for days or 'mo' for months.`
      );
  }
}

export { calculateFutureDate };

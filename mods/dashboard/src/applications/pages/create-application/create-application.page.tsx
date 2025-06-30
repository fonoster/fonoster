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
import type { Route } from "./+types/create-application.page";
import { ApplicationProvider } from "~/applications/stores/application.store";
import { CreateApplicationContainer } from "./create-application.container";

/**
 * Sets the metadata for the "Create Application" page.
 * Used by the router to define the page title and description.
 *
 * @param _ - Meta arguments (unused).
 * @returns Array of meta objects for the page.
 */
export function meta(_: Route.MetaArgs) {
  return [
    { title: "Voice Applications | Fonoster" },
    {
      name: "description",
      content:
        "An Application defines how your Voice AI behaves. Use Autopilot for LLM-based agents or External for custom logic."
    }
  ];
}

/**
 * Page component for creating a new voice application.
 * Includes:
 *  - Page header with navigation and actions.
 *  - Form for application details.
 *  - Save and Test Call actions.
 */
export default function CreateApplication() {
  return (
    <ApplicationProvider>
      <CreateApplicationContainer />
    </ApplicationProvider>
  );
}

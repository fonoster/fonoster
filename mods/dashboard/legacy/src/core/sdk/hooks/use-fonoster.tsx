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
import { useContext } from "react";
import { FonosterContext } from "../stores/fonoster.store";

/**
 * Internal hook used to access the FonosterContext.
 *
 * Throws a descriptive error if used outside of the FonosterProvider.
 *
 * @returns The current value of the Fonoster context.
 */
const useFonosterContext = () => {
  const context = useContext(FonosterContext);

  if (!context) {
    throw new Error(
      "Oops! You need to be inside a <FonosterProvider /> to use this hook."
    );
  }

  return context;
};

/**
 * Hook that provides access to the Fonoster client and related context.
 *
 * Ensures that the client is available before returning the context,
 * making it safe to use SDK modules or perform client operations.
 *
 * @throws Error if the client is not initialized.
 * @returns An object containing the Fonoster client, session state,
 *          authentication helpers, and SDK modules.
 */
export const useFonoster = () => {
  const { client, sdk, ...rest } = useFonosterContext();

  if (!client || !sdk) {
    throw new Error(
      "Oops! The Fonoster client is not available. Please check your configuration."
    );
  }

  return { client, sdk, ...rest };
};

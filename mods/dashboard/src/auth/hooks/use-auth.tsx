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
import { AuthenticatedContext } from "../stores/authenticated.store";

/**
 * Custom hook to access the authentication context.
 * Throws an error if used outside of an <AuthenticatedProvider />.
 *
 * @returns The current authentication context value.
 */
const useAuthContext = () => {
  const context = useContext(AuthenticatedContext);

  if (!context) {
    throw new Error(
      "Oops! You need to be inside an <AuthenticatedProvider /> to use this hook."
    );
  }

  return context;
};

/**
 * Custom hook to access authenticated user data.
 * Ensures the user is authenticated before usage.
 * Throws an error if the user is not authenticated.
 *
 * @returns An object containing the authenticated user and additional context.
 */
export const useAuth = () => {
  const { user, ...rest } = useAuthContext();

  if (!user) {
    throw new Error("Oops! You need to be authenticated to use this hook.");
  }

  return { user, ...rest };
};

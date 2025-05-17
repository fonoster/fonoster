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
import { useContext, useLayoutEffect } from "react";
import { useNavigate } from "react-router";
import { SessionContext } from "./session.store";

export const useSession = () => {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error("useSession() must be used within a <SessionProvider />");
  }

  return context;
};

export const useRequiredSession = () => {
  const { session, user, ...rest } = useSession();
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (!session) {
      navigate("/auth/login", { replace: true, viewTransition: true });
    }
  }, [session, navigate]);

  if (!session || !user) {
    throw new Error("Oops! You need to be authenticated to access this page.");
  }

  return { session, ...rest };
};

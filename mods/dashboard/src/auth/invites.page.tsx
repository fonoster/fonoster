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
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Splash } from "~/components/status/splash";
import { useRuntime } from "~/lib/runtime-context";
import { AuthLayout } from "./auth-layout";
import { acceptInviteUrl, clearInvite, markInviteInFlight } from "./invite";

/** /invites?token=… from the invite email: hand the token to the API. */
export function InvitesPage() {
  const [params] = useSearchParams();
  const { apiUrl } = useRuntime();
  const token = params.get("token");

  useEffect(() => {
    if (!token) return;
    markInviteInFlight();
    window.location.replace(acceptInviteUrl(apiUrl, token));
  }, [apiUrl, token]);

  if (!token) return <InviteFailedPage />;
  return <Splash label="Accepting your invite…" />;
}

/** The API couldn't accept the invite (expired, used, or tampered with). */
export function InviteFailedPage() {
  useEffect(clearInvite, []);
  return (
    <AuthLayout
      title="This invite doesn't work"
      footer={
        <Link to="/sign-in" className="hover:text-foreground hover:underline">
          Go to sign in
        </Link>
      }
    >
      <Alert variant="error">
        The link has expired or was already used. Ask your workspace admin to
        resend the invite.
      </Alert>
    </AuthLayout>
  );
}

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
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Splash } from "~/components/status/splash";
import { useAuth } from "~/lib/auth";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { AuthLayout } from "./auth-layout";
import { consumeGitHubState } from "./github";

export default function GitHubCallbackPage() {
  const [params] = useSearchParams();
  const { signInWithGitHub } = useAuth();
  const navigate = useNavigate();
  const [failure, setFailure] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice; the code can only be exchanged once.
    if (started.current) return;
    started.current = true;

    const code = params.get("code");
    if (params.get("error")) {
      setFailure("GitHub sign-in was cancelled.");
      return;
    }
    if (!consumeGitHubState(params.get("state")) || !code) {
      setFailure(
        "This sign-in link isn't valid anymore. Start again from the sign-in page."
      );
      return;
    }
    signInWithGitHub(code)
      .then(() => navigate("/", { replace: true }))
      .catch((error: unknown) => setFailure(gitHubFailure(error)));
  }, [params, signInWithGitHub, navigate]);

  if (!failure) return <Splash label="Signing you in with GitHub…" />;

  return (
    <AuthLayout
      title="Couldn't sign in with GitHub"
      footer={
        <Link to="/sign-in" className="hover:text-foreground hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Alert variant="error">{failure}</Alert>
    </AuthLayout>
  );
}

/** Says why GitHub sign-in was refused; "no account" is the only vague case. */
function gitHubFailure(error: unknown): string {
  const message = errorMessage(error);
  if (/verified primary email/i.test(message)) {
    return "Your GitHub account has no verified primary email. Verify an email on GitHub, make it your primary, then try again.";
  }
  if (
    grpcCode(error) === GrpcCode.PERMISSION_DENIED &&
    /invalid credentials/i.test(message)
  ) {
    return "This GitHub account can't sign in here. Ask your workspace admin for an invite.";
  }
  return message;
}

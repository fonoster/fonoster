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
import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot
} from "~/components/ui/input-otp";
import { toast } from "~/components/ui/sonner";
import { useAuth } from "~/lib/auth";
import { GrpcCode, errorMessage, grpcCode } from "~/lib/errors";
import { AuthLayout, authButton } from "./auth-layout";
import { EMAIL_CONTACT } from "./schemas";

export const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;

type CodeState = { email: string; next?: string; sentAt?: number };

function secondsLeft(sentAt: number, now: number) {
  return Math.max(
    0,
    RESEND_COOLDOWN_SECONDS - Math.floor((now - sentAt) / 1000)
  );
}

export default function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CodeState | null;
  if (!state?.email) return <Navigate to="/sign-in" replace />;
  return <CheckEmail {...state} />;
}

function CheckEmail({
  email,
  next = "/",
  sentAt: initialSentAt = Date.now()
}: CodeState) {
  const { client, signInWithCode } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentAt, setSentAt] = useState(initialSentAt);
  const [now, setNow] = useState(Date.now());
  const wait = secondsLeft(sentAt, now);

  useEffect(() => {
    if (wait === 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [wait]);

  async function submit(value: string) {
    if (value.length !== CODE_LENGTH || submitting) return;
    setSubmitting(true);
    setFailure(null);
    try {
      await signInWithCode(email, value);
      navigate(next, { replace: true });
    } catch (error) {
      const code = grpcCode(error);
      setFailure(
        code === GrpcCode.PERMISSION_DENIED || code === GrpcCode.UNAUTHENTICATED
          ? "That code isn't valid. Check it, or send a new one."
          : errorMessage(error)
      );
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setFailure(null);
    try {
      await client.sendVerificationCode(EMAIL_CONTACT, email);
      setSentAt(Date.now());
      setNow(Date.now());
      toast.success("We sent a new code.");
    } catch (error) {
      setFailure(errorMessage(error));
    }
  }

  const minutes = Math.floor(wait / 60);
  const seconds = String(wait % 60).padStart(2, "0");

  return (
    <AuthLayout
      title="Check your email"
      description={
        <>
          We sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{email}</span>
        </>
      }
      footer={
        <span>
          The code expires in 5 minutes. Check spam if it's not there.
        </span>
      }
    >
      {failure && <Alert variant="error">{failure}</Alert>}
      <form
        className="flex flex-col items-center gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(code);
        }}
      >
        <InputOTP
          maxLength={CODE_LENGTH}
          value={code}
          onChange={setCode}
          onComplete={(value: string) => void submit(value)}
          autoFocus
          inputMode="numeric"
          pattern="^[0-9]*$"
          aria-label="Sign-in code"
          aria-invalid={Boolean(failure)}
        >
          <InputOTPGroup>
            {Array.from({ length: CODE_LENGTH }, (_, index) => (
              <InputOTPSlot
                key={index}
                index={index}
                aria-invalid={Boolean(failure)}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <Button
          type="submit"
          className={authButton}
          loading={submitting}
          disabled={code.length !== CODE_LENGTH}
        >
          Continue
        </Button>
      </form>
      <div className="flex items-center justify-between font-display text-[13px] text-muted-foreground">
        <span>
          Didn't get it?{" "}
          {wait > 0 ? (
            <span aria-live="polite">
              Resend in {minutes}:{seconds}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => void resend()}
              className="cursor-pointer font-medium text-brand-text hover:underline"
            >
              Resend code
            </button>
          )}
        </span>
        <Link to="/sign-in" className="hover:text-foreground hover:underline">
          Use a different email
        </Link>
      </div>
    </AuthLayout>
  );
}

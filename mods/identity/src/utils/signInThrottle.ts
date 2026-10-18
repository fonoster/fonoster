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
import { status } from "@grpc/grpc-js";
import { SIGN_IN_FAILURE_LIMITS } from "../constants";
import { createRateLimiter } from "./rateLimiter";

type SignInFailureLimits = {
  perEmail: number;
  perIp: number;
  windowMs: number;
};

/**
 * Slows down password and code guessing on sign-in. Failed attempts are
 * counted per email and per client IP; once either reaches its limit, sign-in
 * for that email (or from that IP) is refused for one window, right or wrong.
 * Only failures count, so someone who knows an email can't lock its owner out
 * by signing in successfully elsewhere, and a user who signs in fine is never
 * slowed down.
 *
 * Kept in this process's memory, like the other Identity limits: with several
 * replicas each enforces its own limit.
 */
function createSignInThrottle(
  limits: SignInFailureLimits = SIGN_IN_FAILURE_LIMITS
) {
  const { perEmail, perIp, windowMs } = limits;
  // tryConsume refuses the use after `limit`, so `limit - 1` makes the
  // limit-th failure the one that blocks.
  const emailFailures = createRateLimiter({
    limit: Math.max(perEmail - 1, 0),
    windowMs
  });
  const ipFailures = createRateLimiter({
    limit: Math.max(perIp - 1, 0),
    windowMs
  });
  const blockedUntil = new Map<string, number>();

  const emailKey = (email: string) => `email:${email.trim().toLowerCase()}`;
  const ipKey = (ip: string) => `ip:${ip}`;

  const isBlocked = (key: string, now: number) => {
    const until = blockedUntil.get(key);
    if (until === undefined) return false;
    if (now >= until) {
      blockedUntil.delete(key);
      return false;
    }
    return true;
  };

  const block = (key: string, now: number) => {
    blockedUntil.set(key, now + windowMs);
    // Keep the map from growing without bound.
    if (blockedUntil.size > 10_000) {
      blockedUntil.forEach((until, k) => {
        if (now >= until) blockedUntil.delete(k);
      });
    }
  };

  return {
    /** True while sign-in for this email, or from this IP, is refused. */
    isBlocked(email: string, ip: string, now = Date.now()): boolean {
      return isBlocked(ipKey(ip), now) || isBlocked(emailKey(email), now);
    },

    /** Counts one failed sign-in for the email and the IP. */
    recordFailure(email: string, ip: string, now = Date.now()) {
      if (!ipFailures(ipKey(ip), now)) block(ipKey(ip), now);
      if (!emailFailures(emailKey(email), now)) block(emailKey(email), now);
    }
  };
}

type SignInThrottle = ReturnType<typeof createSignInThrottle>;

const tooManySignInAttempts = {
  code: status.RESOURCE_EXHAUSTED,
  message: "Too many sign-in attempts; try again later"
};

export {
  createSignInThrottle,
  SignInFailureLimits,
  SignInThrottle,
  tooManySignInAttempts
};

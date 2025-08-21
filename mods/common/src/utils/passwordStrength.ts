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
export type PasswordStrength = "weak" | "fair" | "strong";

/**
 * Assesses the strength of a password based on various criteria.
 *
 * @param password - The password to assess
 * @returns PasswordStrength - 'weak', 'fair', or 'strong'
 */
export function assessPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 8) {
    return "weak";
  }

  let score = 0;

  // Length contribution
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;

  // Character variety contribution
  if (/[a-z]/.test(password)) score += 1; // lowercase
  if (/[A-Z]/.test(password)) score += 1; // uppercase
  if (/\d/.test(password)) score += 1; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 1; // special characters

  // Determine strength based on score
  if (score >= 5) return "strong";
  if (score >= 3) return "fair";
  return "weak";
}

/**
 * Gets a user-friendly message describing the password strength.
 *
 * @param strength - The password strength level
 * @returns A human-readable message about the password strength
 */
export function getPasswordStrengthMessage(strength: PasswordStrength): string {
  if (strength === "strong") {
    return "Ahoy! Your password is strong!";
  }

  if (strength === "fair") {
    return "Fair password - consider adding more variety";
  }

  if (strength === "weak") {
    return "Weak password - try a longer password with more variety";
  }

  return "Please enter your new password";
}

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
 * Gets a numerical score (0-100) for the password strength.
 *
 * @param password - The password to assess
 * @returns A number between 0 and 100 representing password strength
 */
export function getPasswordStrengthScore(password: string): number {
  if (!password || password.length < 8) {
    return 0;
  }

  let score = 0;

  // Length contribution (max 30 points)
  if (password.length >= 16) score += 30;
  else if (password.length >= 12) score += 25;
  else if (password.length >= 8) score += 20;

  // Character variety contribution (max 70 points)
  if (/[a-z]/.test(password)) score += 15; // lowercase
  if (/[A-Z]/.test(password)) score += 15; // uppercase
  if (/\d/.test(password)) score += 15; // numbers
  if (/[^a-zA-Z0-9]/.test(password)) score += 25; // special characters (weighted higher)

  return Math.min(score, 100);
}

/**
 * Gets a color value for displaying password strength in the progress bar.
 *
 * @param strength - The password strength level
 * @returns A hex color value
 */
export function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case "strong":
      return "#10b981"; // green-500
    case "fair":
      return "#f59e0b"; // amber-500
    case "weak":
      return "#ef4444"; // red-500
    default:
      return "#6b7280"; // gray-500
  }
}

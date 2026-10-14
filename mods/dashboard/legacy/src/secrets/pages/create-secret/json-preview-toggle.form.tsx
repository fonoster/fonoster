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
import React from "react";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";
import { Box } from "@mui/material";

/**
 * Props interface for the JsonPreviewToggle component.
 */
interface JsonPreviewToggleProps {
  /**
   * Indicates whether the checkbox is currently checked.
   */
  checked: boolean;

  /**
   * Callback function to handle checkbox state changes.
   *
   * @param checked - The new checked state.
   */
  onChange: (checked: boolean) => void;

  /**
   * Disables the checkbox if true, preventing user interaction.
   */
  disabled: boolean;
}

/**
 * JsonPreviewToggle component.
 *
 * Renders a checkbox that allows users to toggle the JSON preview display
 * in a parent form or component.
 *
 * Integrates:
 * - MUI's Box component for layout.
 * - A reusable Checkbox component from the design system.
 *
 * @param {JsonPreviewToggleProps} props - Props including checked state, onChange handler, and disabled flag.
 * @returns {JSX.Element} The rendered JSON preview toggle.
 */
export const JsonPreviewToggle: React.FC<JsonPreviewToggleProps> = ({
  checked,
  onChange,
  disabled
}) => (
  <Box>
    <Checkbox
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
    >
      Show preview (JSON only)
    </Checkbox>
  </Box>
);

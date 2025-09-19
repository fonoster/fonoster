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

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { Select } from "~/core/components/design-system/ui/select/select";
import { Input } from "~/core/components/design-system/ui/input/input";
import { Checkbox } from "~/core/components/design-system/ui/checkbox/checkbox";
import { useFormField } from "~/core/components/design-system/forms";
import type { SelectOption } from "~/core/components/design-system/ui/select/select";
import {
  TTS_DEEPGRAM_VOICES,
  TTS_ELEVENLABS_VOICES
} from "../create-application.const";

interface VoiceSelectorProps {
  value?: string;
  onChange?: (event: { target: { value: string } }) => void;
  onBlur?: () => void;
  name?: string;
  ttsVendor?: string;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
}

export const VoiceSelector = ({
  value,
  onChange,
  onBlur,
  name,
  ttsVendor,
  label = "Voice",
  disabled = false,
  placeholder
}: VoiceSelectorProps) => {
  const { error } = useFormField();

  // Get available voices based on vendor
  const getAvailableVoices = (): SelectOption[] => {
    if (ttsVendor === "tts.deepgram") {
      return TTS_DEEPGRAM_VOICES;
    }
    return TTS_ELEVENLABS_VOICES;
  };

  const availableVoices = getAvailableVoices();

  // Check if current value is a custom voice (not in predefined lists)
  const isValueCustom = (voiceValue: string): boolean => {
    if (!voiceValue) return false;

    const allPredefinedVoices = [
      ...TTS_DEEPGRAM_VOICES.map((v) => v.value),
      ...TTS_ELEVENLABS_VOICES.map((v) => v.value)
    ];

    return !allPredefinedVoices.includes(voiceValue);
  };

  // Determine if current value is a custom voice
  const isCustomVoice = value ? isValueCustom(value) : false;

  // State for manual toggle (independent of value detection)
  const [manualCustomMode, setManualCustomMode] = useState(false);

  // Final decision: show custom input if user manually toggled OR value is custom
  // Note: manualCustomMode persists even when field is empty
  const showCustomInput = manualCustomMode || isCustomVoice;

  // Initialize manual mode based on current value only once
  useEffect(() => {
    if (value && isValueCustom(value)) {
      setManualCustomMode(true);
    }
  }, []); // Only run once on mount

  // Set manual mode when we detect a custom voice value (but don't unset it when field is empty)
  useEffect(() => {
    if (value && isValueCustom(value)) {
      setManualCustomMode(true);
    }
    // Note: We don't set manualCustomMode to false when value is empty
    // This allows manual mode to persist when user clears the field
  }, [value]);

  // Reset manual mode when provider changes
  useEffect(() => {
    setManualCustomMode(false);
  }, [ttsVendor]);

  // Handle checkbox toggle
  const handleCustomVoiceToggle = (checked: boolean) => {
    setManualCustomMode(checked);

    if (checked) {
      // When switching to custom, clear the value if it's a predefined voice
      if (value && !isValueCustom(value)) {
        onChange?.({ target: { value: "" } });
      }
    } else {
      // When switching to predefined, set to first available voice
      const firstVoice = availableVoices[0]?.value || "";
      onChange?.({ target: { value: String(firstVoice) } });
    }
  };

  // Handle voice selection change
  const handleVoiceChange = (newValue: string) => {
    onChange?.({ target: { value: newValue } });
  };

  return (
    <Box>
      {/* Voice selection - either Select or Input based on toggle */}
      {showCustomInput ? (
        <Input
          label="Custom Voice ID"
          value={value || ""}
          onChange={(e) => handleVoiceChange(e.target.value)}
          onBlur={onBlur}
          name={name}
          placeholder={placeholder || "Enter Voice ID"}
          disabled={disabled}
        />
      ) : (
        <Select
          label={label}
          options={availableVoices}
          value={value || ""}
          onChange={(e) => handleVoiceChange(String(e.target.value))}
          onBlur={onBlur}
          name={name}
          disabled={disabled}
        />
      )}

      {/* Custom voice toggle checkbox */}
      <Box sx={{ mt: 1 }}>
        <Checkbox
          checked={showCustomInput}
          onChange={(e) => handleCustomVoiceToggle(e.target.checked)}
          disabled={disabled}
        >
          Add Voice ID Manually
        </Checkbox>
      </Box>

      {/* Error message - use form error if available */}
      {error && (
        <Box sx={{ mt: 0.5, color: "error.main", fontSize: "0.75rem" }}>
          {error.message}
        </Box>
      )}
    </Box>
  );
};

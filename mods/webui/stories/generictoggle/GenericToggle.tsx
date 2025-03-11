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
import { useEffect, useState } from "react";
import { StyledMuiSwitch, StyledIcon } from "./GenericToggle.styles";
import { GenericToggleProps } from "./types";
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';

export const GenericToggle = (props: GenericToggleProps) => {
  const { defaultValue, value, disabled, onChange } = props;

  const [isChecked, setIsChecked] = useState(value ?? defaultValue);

  useEffect(() => {
    setIsChecked(value ?? defaultValue);
  }, [value, defaultValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <StyledMuiSwitch
      checked={isChecked}
      disabled={disabled}
      onChange={handleChange}
      icon={
        <StyledIcon>
          <DarkModeOutlinedIcon sx={{ color: "black", fontSize: 8 }} />
        </StyledIcon>
      }
      checkedIcon={
        <StyledIcon checked>
          <LightModeOutlinedIcon sx={{ fontSize: 8 }} />
        </StyledIcon>
      }
    />
  );
};

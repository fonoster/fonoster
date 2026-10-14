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
import { useCallback, useEffect, useState } from "react";
import { SwitchRoot } from "./switch.styles";

export interface SwitchProps {
  defaultValue?: boolean;
  value?: boolean;
  disabled?: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Switch = (props: SwitchProps) => {
  const { defaultValue, value, disabled, onChange } = props;

  const [isChecked, setIsChecked] = useState(value ?? defaultValue);

  useEffect(() => {
    setIsChecked(value ?? defaultValue);
  }, [value, defaultValue]);

  const onChangeEvent = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setIsChecked(event.target.checked);

      if (onChange) {
        onChange(event);
      }
    },
    [onChange]
  );

  return (
    <SwitchRoot
      checked={isChecked}
      disabled={disabled}
      onChange={onChangeEvent}
    />
  );
};

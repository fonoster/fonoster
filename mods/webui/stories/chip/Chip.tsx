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
import React from "react";
import { ChipProps } from "./types";
import { StyledMuiChip } from "./Chip.styles";
import CloseIcon from "@mui/icons-material/Close";

export const Chip = ({ label, onRemove, enabled = true, size = 'medium' }: ChipProps) => {
  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    if (onRemove) {
      onRemove();
    }

    return false;
  };

  const CustomCloseIcon = (props: any) => (
    <div
      onClick={handleDelete}
      onMouseDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
    >
      <CloseIcon {...props} />
    </div>
  );

  return (
    <StyledMuiChip
      label={label}
      onDelete={handleDelete}
      disabled={!enabled}
      size={size}
      deleteIcon={<CustomCloseIcon />}
    />
  );
};

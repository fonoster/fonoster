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
import { styled } from "@mui/material/styles";
import { Chip } from "@mui/material";

export const StyledMuiChip = styled(Chip)(({ theme }) => ({
  fontFamily: "'Poppins', sans-serif",
  display: "flex",
  alignItems: "center",
  borderRadius: 18,
  backgroundColor: theme.palette.primary[200],
  color: theme.palette.text.primary,
  "& .MuiChip-label": {
    color: theme.palette.secondary[900]
  },
  "& .MuiChip-deleteIcon": {
    color: theme.palette.secondary[900]
  },
  "&:hover": {
    backgroundColor: theme.palette.primary[500]
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.secondary[100],
    color: theme.palette.secondary[500],
    pointerEvents: "none"
  },
  '&.MuiChip-sizeSmall': {
    height: '24px',
    fontSize: '12px',
    '.MuiChip-label': {
      padding: '0 8px',
    },
    '.MuiChip-deleteIcon': {
      fontSize: '16px',
      margin: '0 4px',
    },
  },
  '&.MuiChip-sizeMedium': {
    height: '32px',
    fontSize: '14px',
    '.MuiChip-label': {
      padding: '0 12px',
    },
    '.MuiChip-deleteIcon': {
      fontSize: '20px',
      margin: '0 6px',
    },
  },
}));

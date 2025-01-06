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
import Chip from "@mui/material/Chip";

export const StyledMuiChip = styled(Chip)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: 8,
  size: "medium",
  fontWeight: 500,
  backgroundColor: theme.palette.primary[200],
  color: theme.palette.text.primary,
  "& .MuiChip-label": {
    color: theme.palette.secondary[800]
  },
  "& .MuiChip-deleteIcon": {
    color: theme.palette.primary
  },
  "&:hover": {
    backgroundColor: theme.palette.primary[500]
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.secondary[100],
    color: theme.palette.secondary[500],
    pointerEvents: "none"
  }
}));

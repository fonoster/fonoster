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
import TablePagination, {
  TablePaginationProps
} from "@mui/material/TablePagination";
import React from "react";

export type StyledPaginationProps = TablePaginationProps & {
  component?: React.ElementType;
};

export const StyledPagination = styled(TablePagination)<StyledPaginationProps>(
  ({ theme }) => ({
    "& .MuiTablePagination-toolbar": {
      display: "flex",
      justifyContent: "flex-start",
      gap: theme.spacing(0.5)
    },
    "& .MuiTablePagination-actions": {
      order: -1,
      gap: theme.spacing(0.1),
      "& .MuiSvgIcon-root": {
        fontSize: "2rem",
        fontWeight: 700
      },
      "& button": {
        margin: 0,
        padding: theme.spacing(0.1)
      }
    },
    "&.disabled": {
      color: theme.palette.secondary[200],
      pointerEvents: "none"
    }
  })
);

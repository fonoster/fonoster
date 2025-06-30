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
import { Box, styled, TableContainer, Table, TableCell } from "@mui/material";

export const DataTableToolbarElement = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 16
}));

export const DataTableRootElement = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: 12
}));

export const TableRoot = styled(Table)(() => ({
  borderCollapse: "collapse",
  width: "100%",
  tableLayout: "fixed"
}));

export const TableCellRoot = styled(TableCell)(({ theme }) => ({
  height: "31px",
  padding: "0px 4px",
  fontSize: "10px",
  fontWeight: 500,
  color: theme.palette.base["03"],
  borderBottom: `solid 1px ${theme.palette.base["07"]}`,
  textAlign: "left",
  fontFeatureSettings: "'liga' off, 'clig' off",
  fontFamily: "Poppins",
  lineHeight: "normal",
  fontStyle: "normal",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",

  "&:first-of-type": {
    paddingLeft: "8px"
  },
  "&:last-of-type": {
    paddingRight: "8px"
  },
  "&[data-selection-cell='true']": {
    padding: "0px 4px",
    width: "48px",
    maxWidth: "48px",
    minWidth: "48px",
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box"
  }
}));

export const DataTableContainerElement = styled(TableContainer)(
  ({ theme }) => ({
    border: `solid 1px ${theme.palette.base["06"]}`,
    borderTopLeftRadius: "4px",
    borderTopRightRadius: "4px",
    overflowX: "auto",
    backgroundColor: theme.palette.background.paper,

    "& table": {
      borderCollapse: "collapse",
      width: "100%",
      tableLayout: "fixed",

      "& thead": {
        backgroundColor: theme.palette.base["07"]
      },

      "& th": {
        borderBottom: "none"
      },

      "& tbody": {
        "& tr:last-of-type": {
          "& td": {
            borderBottom: "none"
          }
        },

        "& td": {
          padding: "0px 4px",
          minHeight: "36px",
          height: "36px",
          fontSize: "10px",
          color: theme.palette.base["03"],
          borderBottom: `solid 1px ${theme.palette.base["07"]}`,
          fontFeatureSettings: "'liga' off, 'clig' off",
          fontFamily: "Poppins",
          lineHeight: "normal",
          fontStyle: "normal",
          fontWeight: 500,
          textAlign: "left",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",

          "&:first-of-type": {
            paddingLeft: "8px"
          },
          "&:last-of-type": {
            paddingRight: "8px"
          },

          "&[data-selection-cell='true']": {
            padding: "0px",
            width: "48px",
            maxWidth: "48px",
            minWidth: "48px",
            display: "flex",
            alignItems: "center",
            boxSizing: "border-box"
          }
        },

        "& tr.Mui-selected": {
          backgroundColor: "transparent",
          "&:hover": {
            backgroundColor: "transparent"
          }
        }
      }
    },

    "&[data-variant='compact']": {
      "& table thead": {
        backgroundColor: theme.palette.base["06"]
      }
    }
  })
);

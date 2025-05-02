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
import { Box } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/ModeEditOutline";
import { useDataTable } from "../data-table.context";
import { Checkbox } from "../../checkbox/checkbox";

export const DataTableToolbarSelection = () => {
  const { table, features, onDeleteSelected, onEditSelected, selectedRows } =
    useDataTable();

  const numSelected = selectedRows.length;

  if (!features.includes("selection")) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "base.07",
        borderRadius: "4px",
        border: "1px solid var(--fonoster-palette-base-06)",
        background: "base.07",
        minHeight: "32px",
        minWidth: "32px"
      }}
    >
      <Checkbox
        indeterminate={
          table.getIsSomeRowsSelected() && !table.getIsAllRowsSelected()
        }
        checked={table.getIsAllRowsSelected()}
        onChange={() => table.toggleAllRowsSelected()}
        sx={{
          maxWidth: "32px",
          maxHeight: "32px"
        }}
      />

      {Boolean(numSelected) && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "base.02"
          }}
        >
          <Box
            component="span"
            sx={{
              height: "16px",
              width: "1px",
              backgroundColor: "base.06"
            }}
          />
          {onDeleteSelected && (
            <Box
              sx={{
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "0px 8px"
              }}
              onClick={() => onDeleteSelected(selectedRows)}
            >
              <DeleteIcon fontSize="inherit" />
            </Box>
          )}
          {onEditSelected && numSelected === 1 && (
            <Box
              sx={{
                fontSize: "20px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "0px 10px 0px 0px"
              }}
              onClick={onEditSelected}
            >
              <EditIcon fontSize="inherit" />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

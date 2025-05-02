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
import React, { useCallback, useState } from "react";
import { Menu, MenuItem, IconButton, ListItemText } from "@mui/material";
import { Icon } from "../../../icons/icons";
import type { Column } from "@tanstack/react-table";
import type { SortOrder } from "../data-table.interfaces";

interface SortMenuProps<TData, TValue> {
  onSortChange: (order: SortOrder) => void;
  column: Column<TData, TValue>;
}

const SORT_OPTIONS = [
  { label: "Ascending Order", value: "asc" },
  { label: "Descending Order", value: "desc" }
];

export const SortMenu: React.FC<SortMenuProps<any, any>> = ({
  onSortChange,
  column
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleSelect = useCallback(
    (order: SortOrder) => {
      onSortChange(order);
      handleClose();
    },
    [onSortChange, handleClose]
  );

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ padding: 0, fontSize: "12px" }}>
        {column.getIsSorted() === "asc" ? (
          <Icon name="KeyboardArrowUpIcon" fontSize="inherit" />
        ) : column.getIsSorted() === "desc" ? (
          <Icon name="KeyboardArrowDownIcon" fontSize="inherit" />
        ) : (
          <Icon name="UnfoldMore" fontSize="inherit" />
        )}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={handleClose}
        slotProps={{
          paper: {
            sx: {
              padding: "0px",
              borderRadius: "4px",
              boxShadow: "0px 5px 10px 0px rgba(0, 0, 0, 0.10)",
              borderRight: "1px solid var(--fonoster-palette-base-06)",
              borderBottom: "1px solid var(--fonoster-palette-base-06)",
              backgroundColor: "var(--fonoster-palette-background-paper)"
            }
          }
        }}
      >
        {SORT_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            sx={{
              padding: "4px 8px",
              borderBottom: "1px solid var(--fonoster-palette-base-06)",
              "&:last-child": {
                borderBottom: "none"
              },
              "&:hover": {
                backgroundColor: "transparent"
              }
            }}
            onClick={() => handleSelect(option.value as SortOrder)}
          >
            <ListItemText
              slotProps={{
                primary: {
                  sx: {
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--fonoster-palette-base-03)",
                    fontFeatureSettings: "'liga' off, 'clig' off",
                    fontFamily: "Poppins",
                    lineHeight: "normal",
                    fontStyle: "normal"
                  }
                }
              }}
            >
              {option.label}
            </ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

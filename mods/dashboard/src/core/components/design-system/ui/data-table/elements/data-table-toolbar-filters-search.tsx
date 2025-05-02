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

import type React from "react";
import { useState } from "react";
import { TextField, InputAdornment, styled } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

export interface FilterSearchProps {
  onSearchChange: (searchText: string) => void;
  placeholder?: string;
}

const InputRoot = styled(TextField)<{ $active?: boolean }>(
  ({ $active, theme }) => ({
    "& .MuiOutlinedInput-root": {
      paddingRight: "8px",
      backgroundColor: theme.palette.base["07"],
      maxHeight: "32px",
      minWidth: "145px",
      borderRadius: "4px",
      border: "1px solid transparent",
      borderColor: $active
        ? theme.palette.brand["04"]
        : theme.palette.base["06"],
      "& fieldset": {
        border: "none"
      },
      "&:hover fieldset": {
        border: "none"
      },
      "&.Mui-focused fieldset": {
        border: "none"
      }
    },

    "& .MuiInputBase-input": {
      padding: "8px",
      fontSize: "10px",
      fontFamily: "Poppins",
      fontWeight: 500,
      maxHeight: "32px",
      color: theme.palette.base["02"],

      "&::placeholder": {
        color: theme.palette.base["03"],
        opacity: 1
      }
    }
  })
);

export const FilterSearch: React.FC<FilterSearchProps> = ({
  onSearchChange,
  placeholder = "Search"
}) => {
  const [searchText, setSearchText] = useState<string>("");
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchText(value);
    onSearchChange(value);
  };

  return (
    <InputRoot
      fullWidth
      placeholder={placeholder}
      value={searchText}
      onChange={handleSearchChange}
      onFocus={() => setIsSearchFocused(true)}
      onBlur={() => setIsSearchFocused(false)}
      $active={isSearchFocused}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment
              position="end"
              sx={{
                maxHeight: "32px",
                fontSize: "16px",
                color: (theme) => theme.palette.base["02"]
              }}
            >
              <SearchIcon fontSize="inherit" />
            </InputAdornment>
          )
        }
      }}
    />
  );
};

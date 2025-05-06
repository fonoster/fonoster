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
import { useState, useRef, useEffect } from "react";
import {
  Box,
  Paper,
  ClickAwayListener,
  styled,
  Fade,
  Grow
} from "@mui/material";
import type { FilterField } from "../data-table.interfaces";
import { Icon } from "../../../icons/icons";

export interface FilterSearchBySelectorProps {
  searchBy: string;
  searchableFields: FilterField[];
  onSearchByFieldChange: (field: string) => void;
  animationType?: "fade" | "grow";
  animationDuration?: number;
  placeholder?: string;
}

const Trigger = styled(Box)<{ $active?: boolean }>(({ $active, theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px",
  backgroundColor: theme.palette.base["07"],
  borderRadius: "4px",
  cursor: "pointer",
  width: "100%",
  border: "1px solid transparent",
  borderColor: $active ? theme.palette.brand["04"] : theme.palette.base["06"],
  fontSize: "10px",
  fontFamily: "Poppins",
  fontWeight: 500,
  maxHeight: "32px",
  color: theme.palette.base["02"]
}));

const FilterOption = styled(Box)(({ theme }) => ({
  padding: "4px 0px",
  borderBottom: `0.5px solid ${theme.palette.base["05"]}`,
  color: theme.palette.base["03"],
  fontSize: "10px",
  fontWeight: 500,
  cursor: "pointer",
  "&:last-child": {
    borderBottom: "none"
  },
  "&:hover": {
    backgroundColor: "#f0f0f0"
  }
}));

const UnifiedDropdown = styled(Paper)(({ theme }) => ({
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  zIndex: 1300,
  borderRadius: "4px",
  border: `1px solid ${theme.palette.brand["04"] || "#4ade80"}`,
  boxShadow: "none",
  backgroundColor: theme.palette.base["07"] || "#f5f5f5",
  overflow: "hidden",
  width: "100%",
  padding: "8px"
}));

const DropdownHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "8px",
  fontWeight: 500,
  fontSize: "10px",
  fontFamily: "Poppins",
  color: theme.palette.base["02"]
}));

export const FilterSearchBySelector: React.FC<FilterSearchBySelectorProps> = ({
  searchableFields,
  onSearchByFieldChange,
  searchBy,
  animationType = "grow",
  animationDuration = 200,
  placeholder = "Filter By"
}) => {
  const [open, setOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedFilterLabel =
    searchableFields.find((option) => option.value === searchBy)?.label ||
    placeholder;

  const handleFilterSelect = (filterId: string) => {
    onSearchByFieldChange(filterId);
    setOpen(false);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (
      containerRef.current &&
      containerRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), animationDuration);
      return () => clearTimeout(timer);
    }
  }, [open, animationDuration]);

  const renderAnimatedDropdown = () => {
    if (!shouldRender) return null;

    const dropdown = (
      <UnifiedDropdown>
        <DropdownHeader>
          {placeholder}
          <Icon
            name="ArrowDropUp"
            fontSize="small"
            onClick={handleToggle}
            style={{ cursor: "pointer" }}
          />
        </DropdownHeader>

        {searchableFields.map((option) => (
          <FilterOption
            key={option.value}
            onClick={() => handleFilterSelect(option.value)}
          >
            {option.label}
          </FilterOption>
        ))}
      </UnifiedDropdown>
    );

    if (animationType === "fade") {
      return (
        <Fade in={open} timeout={animationDuration} unmountOnExit={false}>
          {dropdown}
        </Fade>
      );
    }

    return (
      <Grow
        in={open}
        timeout={animationDuration}
        style={{ transformOrigin: "0 0 0" }}
        unmountOnExit={false}
      >
        {dropdown}
      </Grow>
    );
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: "145px",
          position: "relative"
        }}
        ref={containerRef}
      >
        <Trigger onClick={handleToggle} $active={open}>
          {selectedFilterLabel}
          <Icon name={"ArrowDropDown"} fontSize="small" />
        </Trigger>

        {renderAnimatedDropdown()}
      </Box>
    </ClickAwayListener>
  );
};

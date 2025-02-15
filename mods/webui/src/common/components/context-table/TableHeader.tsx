'use client'

import React from 'react';
import {
  Box,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { useTableContext } from './useTableContext';

// interface TableHeaderProps {
//   onSearch?: (value: string) => void;
//   onFilterChange?: (value: string) => void;
//   currentPage: number;
//   totalPages: number;
//   onPageChange: (page: number) => void;
//   isTable: boolean;
//   table?:any
// } 
const totalPages = 10;
export const TableHeader = <T extends object,>() => {
  const tableProps = useTableContext<T>();
  const currentPage = tableProps.pageIndex || 0;
console.warn(tableProps)
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={2}
      sx={{ p: 2, pl: 0, pr: 0 }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value="all"
            // onChange={(e) => onFilterChange?.(e.target.value)}
            sx={{
              height: '36px',
              '& .MuiSelect-select': {
                paddingTop: '6px',
                paddingBottom: '6px',
              },
            }}
          >
            <MenuItem value="all">Filter By</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          placeholder="Search..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: { height: '36px' },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {currentPage}-{totalPages} of {totalPages}
        </Typography>
        <Stack direction="row">
          <IconButton
            size="small"
            // onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <KeyboardArrowLeftIcon />
          </IconButton>
          <IconButton
            size="small"
            // onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <KeyboardArrowRightIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Stack>
  );
};

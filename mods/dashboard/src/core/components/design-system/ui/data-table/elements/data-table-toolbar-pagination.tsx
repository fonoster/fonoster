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
import { Box, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useDataTable } from "../data-table.context";
import { Typography } from "../../typography/typography";

export const DataTableToolbarPagination = () => {
  const { pagination, features, pageSize, onNextPage, onPrevPage } =
    useDataTable();

  if (!features.includes("pagination")) return null;

  return (
    <Box display="flex" alignItems="center" gap="4px" paddingRight="16px">
      <IconButton
        onClick={onPrevPage}
        disabled={!pagination.prevToken}
        size="small"
        sx={{ fontSize: "16px" }}
      >
        <ArrowBackIosNewIcon fontSize="inherit" />
      </IconButton>

      <IconButton
        onClick={onNextPage}
        disabled={!pagination.nextToken}
        size="small"
        sx={{ fontSize: "16px" }}
      >
        <ArrowForwardIosIcon fontSize="inherit" />
      </IconButton>
      <Typography variant="body-micro" color="var(--fonoster-palette-base-03)">
        {`1–${pageSize} of ${pagination.total}`}
      </Typography>
    </Box>
  );
};

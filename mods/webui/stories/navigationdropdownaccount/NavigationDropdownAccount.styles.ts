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

export const NavigationDropdownAccountContainer = styled("div")(() => ({
    width: "100%"
}));

export const NavigationDropdownAccountContent = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    padding: "10px 0px"
}));

export const NavigationDropdownAccountHeader = styled("div")(() => ({
    display: "flex",
    alignItems: "center",
    height: "42px",
    padding: "0px 10px"
}));

export const NavigationDropdownAccountMenuItem = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    height: "38px",
    padding: "0px 10px",
    cursor: "pointer",
    "&:hover": {
        backgroundColor: theme.palette.action.hover
    }
}));
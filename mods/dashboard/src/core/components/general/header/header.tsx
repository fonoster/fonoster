/**
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
import { Box, Stack } from "@mui/material";
import { Link } from "../link/link";
import { Logo } from "../../design-system/ui/logo/logo";
import { HeaderRoot, HeaderContent } from "./header.styles";
import { memo } from "react";
import { UserAccountPopover } from "./user-account-options";
import { Notifications } from "./notifications";

export const Header = memo(() => {
  return (
    <HeaderRoot>
      <HeaderContent>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Link to="/" style={{ lineHeight: "0" }}>
            <Logo />
          </Link>
        </Box>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
            flex: "1 1 auto",
            justifyContent: "flex-end"
          }}
        >
          <Notifications />
          <UserAccountPopover />
        </Stack>
      </HeaderContent>
    </HeaderRoot>
  );
});

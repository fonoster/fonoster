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
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";

export const StyledMuiSwitch = styled(Switch)(({ theme }) => ({
  width: 31,
  height: 16,
  padding: 0,
  borderRadius: 8,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 2,
    "&.Mui-checked": {
      transform: "translateX(14.5px)",
      "& + .MuiSwitch-track": {
        opacity: 1,
        border: 0,
        backgroundColor: theme.palette.primary[100]
      }
    },

    "&.Mui-checked .MuiSwitch-thumb": {
      color: theme.palette.primary[500]
    },

    "& .MuiSwitch-thumb": {
      boxShadow: "1px 1px 4px 0px #00000040 inset",
      width: 12,
      height: 12,
      color: theme.palette.secondary[500],
      transition: theme.transitions.create(["background-color"], {
        duration: 200
      })
    },
    "&.Mui-disabled": {
      opacity: 0.5,
      "& + .MuiSwitch-track": {
        opacity: 0.5
      }
    }
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: theme.palette.secondary[200],
    boxSizing: "border-box"
  }
}));

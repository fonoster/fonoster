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

interface StyledIconProps {
  checked?: boolean;
}

export const StyledIcon = styled("div")<StyledIconProps>(({ theme, checked }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  height: "100%",
  color: "#fff",
  backgroundColor: "#008751",
  borderRadius: "50%",
  "& svg": {
    width: 18,
    height: 18
  }
}));

export const StyledMuiSwitch = styled(Switch)(({ theme }) => ({
  width: 60,
  height: 25,
  padding: 0,
  borderRadius: 12.5,
  display: "flex",
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 0,
    top: 3,
    left: 5,
    "&.Mui-checked": {
      transform: "translateX(35px)",
      "& + .MuiSwitch-track": {
        opacity: 1,
        border: 0,
        backgroundColor: theme.palette.primary
      }
    },

    "&.Mui-checked .MuiSwitch-thumb": {
      backgroundColor: "#fff"
    },

    "& .MuiSwitch-thumb": {
      boxShadow: "1px 1px 4px 0px #00000040 inset",
      width: 30,
      height: 30,
      backgroundColor: "#fff",
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
    backgroundColor: "#004d00",
    boxSizing: "border-box"
  }
}));

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

export const StyledSnackbarContainer = styled("div")<{ position: string }>(({
  position
}) => {
  const getPositionStyles = () => {
    const positions = {
      "top-center": {
        justifyContent: "center",
        alignItems: "flex-start",
        paddingTop: "10px"
      },
      "top-right": {
        justifyContent: "flex-end",
        alignItems: "flex-start",
        paddingRight: "10px"
      },
      "top-left": {
        justifyContent: "flex-start",
        alignItems: "flex-start",
        paddingLeft: "10px"
      },
      "bottom-center": {
        justifyContent: "center",
        alignItems: "flex-end",
        paddingCenter: "10px"
      },
      "bottom-right": {
        justifyContent: "flex-end",
        alignItems: "flex-end",
        paddingRight: "10px"
      },
      "bottom-left": {
        justifyContent: "flex-start",
        alignItems: "flex-end",
        paddingLeft: "10px"
      }
    };
    return positions[position];
  };

  return {
    display: "flex",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    ...getPositionStyles()
  };
});

export const StyledSnackbar = styled("div")(({ theme }) => {
  return {
    width: "344px",
    backgroundColor: `var(--background-color, ${theme.palette.primary.main})`,
    color: `var(--text-color, ${theme.palette.primary.main})`,
    borderRadius: "4px",
    padding: "16px",
    boxShadow: theme.shadows[4],
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px"
  };
});

export const StyledMessage = styled("div")(() => ({
  width: "90%",
  fontFamily: "Poppins",
  fontSize: "12px",
  fontWeight: 400,
  textAlign: "left",
  textUnderlinePosition: "from-font",
  textDecorationSkipInk: "none",
  letterSpacing: "0.01em",
  lineHeight: "18px"
}));

export const StyledCloseButtonContainer = styled("div")(() => ({
  width: "10%",
  height: "auto",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
}));

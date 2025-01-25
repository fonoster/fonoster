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
import { createTheme } from "@mui/material/styles";

const fnLight = createTheme({
  palette: {
    primary: {
      "50": "#FFFFFF",
      "100": "#E6FFF5",
      "200": "#CCEFE1",
      "500": "#39E19E",
      "700": "#008751",
      "800": "#053204",
      "900": "#011900"
    },
    secondary: {
      "50": "#F4F4F4",
      "100": "#E8E8E8",
      "200": "#C2C2C2",
      "500": "#8D8D8D",
      "700": "#555555",
      "800": "#333333",
      "900": "#252525",
      main: "#C2C2C2"
    },
    warning: {
      "50": "#FFFFFF",
      "100": "#FFF4F0",
      "200": "#F1DED7",
      "500": "#FF9965",
      "700": "#C46C3F",
      "800": "#612E13",
      "900": "#27150C"
    },
    text: {
      primary: "#555"
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 40
        }
      }
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true
      },
      styleOverrides: {
        root: {
          "& .MuiButton-endIcon": {
            "& > *:first-child": {
              fontSize: "16px",
              marginTop: "2px"
            }
          },
          "& .MuiButton-startIcon": {
            "& > *:first-child": {
              fontSize: "16px",
              marginTop: "2px"
            }
          }
        }
      }
    }
  }
});

export { fnLight };

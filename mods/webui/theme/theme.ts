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
import { createTheme, ThemeOptions } from "@mui/material/styles";

// Definir las opciones del tema claro
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

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      "50": "#0A1F15",
      "100": "#0F2E20",
      "200": "#164A35",
      "500": "#39E19E",
      "700": "#2AAA78",
      "800": "#1D7D57",
      "900": "#0F4A33",
      main: "#39E19E",
      light: "#2AAA78",
      dark: "#164A35",
      contrastText: "#FFFFFF"
    },
    secondary: {
      "50": "#1A1A1A",
      "100": "#2A2A2A",
      "200": "#3D3D3D",
      "500": "#8D8D8D",
      "700": "#AAAAAA",
      "800": "#CCCCCC",
      "900": "#EBEBEB",
      main: "#3D3D3D",
      light: "#8D8D8D",
      dark: "#1A1A1A",
      contrastText: "#FFFFFF"
    },
    warning: {
      "50": "#1F1410",
      "100": "#2E1D16",
      "200": "#4A2F25",
      "500": "#FF9965",
      "700": "#FFB38C",
      "800": "#FFCDB2",
      "900": "#FFE8D9",
      main: "#FF9965",
      light: "#FFB38C",
      dark: "#4A2F25",
      contrastText: "#000000"
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0"
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
};

// Crear los temas
// const fnLight = createTheme(lightThemeOptions);
const fnDark = createTheme(darkThemeOptions);

// Verificar que los temas se hayan creado correctamente
console.log('theme.ts - fnLight primary main:', fnLight.palette.primary.main);
console.log('theme.ts - fnDark primary main:', fnDark.palette.primary.main);

export { fnLight, fnDark };
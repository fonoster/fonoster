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

declare module '@mui/material/styles' {
  interface Palette {
    inputBorder: string;
    notification: {
      success: {
        background: string;
        text: string;
      };
      error: {
        background: string;
        text: string;
      };
      warning: {
        background: string;
        text: string;
      };
      info: {
        background: string;
        text: string;
      };
    };
  }
  interface PaletteOptions {
    inputBorder?: string;
    notification?: {
      success?: {
        background?: string;
        text?: string;
      };
      error?: {
        background?: string;
        text?: string;
      };
      warning?: {
        background?: string;
        text?: string;
      };
      info?: {
        background?: string;
        text?: string;
      };
    };
  }

  interface PaletteColor {
    50?: string;
    100?: string;
    200?: string;
    500?: string;
    700?: string;
    800?: string;
    900?: string;
    main: string;
  }

  interface TypeText {
    primary: string;
  }
}

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
      primary: "#333333",
      secondary: "#555555"
    },
    divider: "#E8E8E8",
    inputBorder: "#C2C2C2",
    notification: {
      success: {
        background: "#CCEFE1",
        text: "#053204"
      },
      error: {
        background: "#FCDADA",
        text: "#5F2120"
      },
      warning: {
        background: "#FFF4DD",
        text: "#663C00"
      },
      info: {
        background: "#D0E4FF",
        text: "#0C3E6F"
      }
    },
    grey: {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#E8E8E8"
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
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid var(--Neutrals-06, #E8E8E8)',
          boxShadow: 'none',
          '--Paper-shadow': 'none',
          '--Paper-overlay': 'none'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E8E8E8",
          "&::before, &::after": {
            borderColor: "#E8E8E8"
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--Neutrals-06': '#E8E8E8'
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
      paper: "#1E1E1E",

    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0"
    },
    divider: "#164A35",
    inputBorder: "#3D3D3D",
    notification: {
      success: {
        background: "#164A35",
        text: "#39E19E"
      },
      error: {
        background: "#3B1A1A",
        text: "#FF8A8A"
      },
      warning: {
        background: "#3D2800",
        text: "#FFB45A"
      },
      info: {
        background: "#0A2A4A",
        text: "#64B5FF"
      }
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
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid var(--Neutrals-06, #E8E8E8)',
          boxShadow: 'none',
          '--Paper-shadow': 'none',
          '--Paper-overlay': 'none'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#E8E8E8",
          "&::before, &::after": {
            borderColor: "#E8E8E8"
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--Neutrals-06': '#E8E8E8'
        }
      }
    }
  }
};
const fnDark = createTheme(darkThemeOptions);

export { fnLight, fnDark };
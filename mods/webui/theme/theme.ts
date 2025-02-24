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
import { Roboto } from "next/font/google";

// Declaramos Roboto fuera para evitar reinicializaciones
export const roboto = Roboto({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

// Definimos las opciones del tema base
const themeOptions: ThemeOptions = {
  typography: {
    fontFamily: roboto.style.fontFamily,
    h1: {
      fontWeight: 500,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.5rem',
      lineHeight: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: "#39E19E",
      light: "#E6FFF5",
      dark: "#008751",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#C2C2C2",
      light: "#E8E8E8",
      dark: "#555555",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#FF9965",
      light: "#FFF4F0",
      dark: "#C46C3F",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FFFFFF",
      paper: "#F4F4F4",
    },
    text: {
      primary: "#333333",
      secondary: "#555555",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: "#6b6b6b #2b2b2b",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "#F4F4F4",
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#C2C2C2",
            minHeight: 24,
            border: "3px solid #F4F4F4",
          },
          "&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus": {
            backgroundColor: "#959595",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '0.5rem 1rem',
          fontWeight: 500,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
    },
  },
};

// Creamos el tema claro
export const fnLight = createTheme(themeOptions);

// Creamos el tema oscuro extendiendo el tema base
export const fnDark = createTheme({
  ...themeOptions,
  palette: {
    ...themeOptions.palette,
    mode: 'dark',
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B0B0B0",
    },
  },
});
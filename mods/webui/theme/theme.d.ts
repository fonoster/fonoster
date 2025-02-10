import '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    primary: PaletteColor
    secondary: PaletteColor
    warning: PaletteColor
  }

  interface PaletteColor {
    50?: string
    100?: string
    200?: string
    500?: string
    700?: string
    800?: string
    900?: string
    main?: string
  }

  interface TypeText {
    primary: string
  }
}

// Asegurarse de que TypeScript reconozca este archivo como un módulo
export {} 
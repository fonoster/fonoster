import React from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { fnLight, fnDark } from '../theme/theme';

// Verificar que los temas estén definidos correctamente
console.log('withThemeProvider - fnLight primary main:', fnLight.palette.primary.main);
console.log('withThemeProvider - fnDark primary main:', fnDark.palette.primary.main);

export const withThemeProvider = (Story, context) => {
  // Use dark theme when background is set to dark or when theme is set to dark
  const useDarkTheme =
    context.globals.backgrounds?.value === '#121212' ||
    context.globals.theme === 'dark';

  // Usar directamente los temas sin modificaciones
  const theme = useDarkTheme ? fnDark : fnLight;

  // Forzar la recarga del tema para asegurarnos de que se aplique correctamente
  console.log('withThemeProvider - Using theme:', theme.palette.primary.main);
  console.log('withThemeProvider - Theme object:', JSON.stringify(theme.palette.primary, null, 2));

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}; 
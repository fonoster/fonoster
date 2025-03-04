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
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { fnLight, fnDark } from '../theme/theme';

interface MainProviderProps {
    children: React.ReactNode;
    useDarkTheme?: boolean;
}

/**
 * MainProvider component that wraps the application with Material UI's ThemeProvider
 * using the custom theme defined in the theme directory.
 * 
 * This provider can be used in stories to ensure consistent theming across all components.
 */
export const MainProvider: React.FC<MainProviderProps> = ({ children, useDarkTheme = false }) => {
    // Forzar la recarga del tema para asegurarnos de que se aplique correctamente
    const theme = React.useMemo(() => {
        return useDarkTheme ? fnDark : fnLight;
    }, [useDarkTheme]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div style={{ padding: '20px' }}>
                {children}
            </div>
        </ThemeProvider>
    );
};

/**
 * Example usage:
 * 
 * import { MainProvider } from '../main';
 * 
 * export const YourStory = () => (
 *   <MainProvider>
 *     <YourComponent />
 *   </MainProvider>
 * );
 */

export default MainProvider; 
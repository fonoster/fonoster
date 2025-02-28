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
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect } from "react";
import { Button } from "./button/Button";
import { fn } from "@storybook/test";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { fnLight, fnDark } from "../theme/theme";
import Paper from "@mui/material/Paper";

/**
 * Componente para mostrar los colores del tema
 */
const ThemeDisplay = () => {
    const theme = useTheme();

    // Valores esperados del tema
    const expectedPrimaryMain = "#39E19E";
    const expectedSecondaryMain = "#C2C2C2";

    // Valores actuales del tema
    const actualPrimaryMain = theme.palette.primary.main;
    const actualSecondaryMain = theme.palette.secondary.main;

    // Verificar si los valores coinciden
    const primaryMatches = actualPrimaryMain === expectedPrimaryMain;
    const secondaryMatches = actualSecondaryMain === expectedSecondaryMain;

    // Imprimir información del tema en la consola para depuración
    useEffect(() => {
        console.log('Theme Display - Current theme:', theme);
        console.log('Theme Display - Primary main:', theme.palette.primary.main);
        console.log('Theme Display - Secondary main:', theme.palette.secondary.main);
        console.log('Theme Display - Is fnLight?', theme === fnLight);
        console.log('Theme Display - Is fnDark?', theme === fnDark);
        console.log('Theme Display - fnLight primary main:', fnLight.palette.primary.main);
        console.log('Theme Display - fnDark primary main:', fnDark.palette.primary.main);
    }, [theme]);

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Theme Colors
            </Typography>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Theme Debug Info
                </Typography>
                <Box sx={{ mb: 4, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
                    <Typography variant="body1">
                        <strong>Expected Primary Main:</strong> {expectedPrimaryMain}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Actual Primary Main:</strong> {actualPrimaryMain} {primaryMatches ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Expected Secondary Main:</strong> {expectedSecondaryMain}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Actual Secondary Main:</strong> {actualSecondaryMain} {secondaryMatches ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2 }}>
                        <strong>Theme Mode:</strong> {theme.palette.mode}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Is Custom Theme:</strong> {JSON.stringify(theme === fnLight || theme === fnDark)}
                    </Typography>
                    <Typography variant="body1">
                        <strong>Theme Components:</strong> {JSON.stringify(theme.components ? 'Defined' : 'Not defined')}
                    </Typography>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Primary Colors
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff' }}>main</Typography>
                    </Box>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.primary.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#000' }}>light</Typography>
                    </Box>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.primary.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff' }}>dark</Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Secondary Colors
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.secondary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>main</Typography>
                    </Box>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.secondary.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>light</Typography>
                    </Box>
                    <Box sx={{ width: 100, height: 100, bgcolor: theme.palette.secondary.dark, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff' }}>dark</Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Expected Colors (Direct from theme file)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                    <Box sx={{ width: 100, height: 100, bgcolor: fnLight.palette.primary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography sx={{ color: '#fff' }}>Primary</Typography>
                    </Box>
                    <Box sx={{ width: 100, height: 100, bgcolor: fnLight.palette.secondary.main, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography>Secondary</Typography>
                    </Box>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Buttons
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" onClick={fn()}>
                        Contained Button
                    </Button>
                    <Button variant="outlined" onClick={fn()}>
                        Outlined Button
                    </Button>
                </Box>
            </Paper>

            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
                <Typography variant="h5" gutterBottom>
                    Material UI Default Buttons (for comparison)
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <button
                        style={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        HTML Button with Theme Color
                    </button>
                </Box>
            </Paper>
        </Box>
    );
};

/**
 * Story para probar el tema
 */
const meta = {
    title: "Theme/Theme Test",
    component: ThemeDisplay,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
} satisfies Meta<typeof ThemeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Ejemplo de visualización del tema
 */
export const Default: Story = {}; 
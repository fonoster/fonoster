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
import type { Preview } from "@storybook/react";
import React, { useEffect } from "react";
import {
  ThemeProvider,
  useThemeMode
} from "../src/core/providers/styling/mui.provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { FormProvider as FonosterFormProvider } from "../src/core/contexts/form-context";
import {
  FormFieldContext,
  FormItemContext
} from "../src/core/components/design-system/forms/form.context";
import fonosterTheme from "./fonoster-theme";
import { create } from "@storybook/theming/create";
import "../src/app.css";

// Create dynamic Storybook themes
const createStorybookTheme = (mode: "light" | "dark") => {
  return create({
    base: mode,
    brandTitle: "Fonoster Design System",
    brandUrl: "https://fonoster.com",
    brandTarget: "_self",

    colorPrimary: "#39E19E",
    colorSecondary: mode === "dark" ? "#CCEFE1" : "#053204",

    // UI
    appBg: mode === "dark" ? "#181818" : "#ffffff",
    appContentBg: mode === "dark" ? "#181818" : "#ffffff",
    appBorderColor: mode === "dark" ? "#555555" : "#E5E5E5",
    appBorderRadius: 8,

    // Typography
    fontBase: '"Inter", sans-serif',
    fontCode: "monospace",

    // Text colors
    textColor: mode === "dark" ? "#FFFFFF" : "#1A1A1A",
    textInverseColor: mode === "dark" ? "#1A1A1A" : "#ffffff",

    // Toolbar colors
    barTextColor: mode === "dark" ? "#FFFFFF" : "#1A1A1A",
    barSelectedColor: "#39E19E",
    barBg: mode === "dark" ? "#252525" : "#ffffff",

    // Form colors
    inputBg: mode === "dark" ? "#252525" : "#ffffff",
    inputBorder: mode === "dark" ? "#555555" : "#E5E5E5",
    inputTextColor: mode === "dark" ? "#FFFFFF" : "#1A1A1A",
    inputBorderRadius: 8
  });
};

// Component to provide form context for Storybook
const FormProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      // Default values for common form fields
      name: "",
      email: "",
      description: "",
      value: "",
      username: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: ""
      // Add more default values as needed
    }
  });

  return (
    <FormProvider {...methods}>
      <FonosterFormProvider>{children}</FonosterFormProvider>
    </FormProvider>
  );
};

// Component to auto-wrap form components with necessary contexts
const FormFieldWrapper = ({ children }: { children: React.ReactNode }) => {
  const methods = useForm({
    defaultValues: {
      storybook_field: ""
    }
  });

  return (
    <FormProvider {...methods}>
      <FonosterFormProvider>
        <FormFieldContext.Provider value={{ name: "storybook_field" }}>
          <FormItemContext.Provider value={{ id: "storybook-field-id" }}>
            {children}
          </FormItemContext.Provider>
        </FormFieldContext.Provider>
      </FonosterFormProvider>
    </FormProvider>
  );
};

// Component to sync Storybook theme with MUI theme
const ThemeSync = ({
  theme,
  children
}: {
  theme: string;
  children: React.ReactNode;
}) => {
  const { changeTheme } = useThemeMode();

  useEffect(() => {
    changeTheme(theme as "light" | "dark");
  }, [theme, changeTheme]);

  return <>{children}</>;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false
    }
  }
});

const preview: Preview = {
  parameters: {
    docs: {
      theme: fonosterTheme // Default theme, will be overridden dynamically
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    },
    backgrounds: {
      disable: true
    },
    layout: "centered"
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "light";

      // Update docs theme dynamically
      context.parameters.docs = {
        ...context.parameters.docs,
        theme: createStorybookTheme(theme as "light" | "dark")
      };

      // Check if this is a form component that needs FormField wrapper
      const storyTitle = context.title.toLowerCase();
      const storyName = context.name.toLowerCase();
      const isFormComponent =
        storyTitle.includes("forms/input") ||
        storyTitle.includes("forms/select") ||
        storyTitle.includes("forms/textarea") ||
        storyName.includes("input") ||
        storyName.includes("select") ||
        storyName.includes("textarea") ||
        context.parameters.formField === true;

      return (
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ThemeSync theme={theme}>
              {isFormComponent ? (
                <FormFieldWrapper>
                  <Story />
                </FormFieldWrapper>
              ) : (
                <FormProviderWrapper>
                  <Story />
                </FormProviderWrapper>
              )}
            </ThemeSync>
          </ThemeProvider>
        </QueryClientProvider>
      );
    }
  ],
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" }
        ],
        dynamicTitle: true
      }
    }
  }
};

export default preview;

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
import type { SxProps } from "@mui/material";

export type TypographyVariant =
  | "heading-large"
  | "heading-medium"
  | "heading-small"
  | "heading-micro"
  | "body-large"
  | "body-medium"
  | "body-small"
  | "body-small-underline"
  | "body-micro"
  | "mono-medium"
  | "mono-medium-underline"
  | "mono-small"
  | "drawer-title"
  | "drawer-label";

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  children?: React.ReactNode;
  color?: string;
  sx?: SxProps;
}

export const VARIANT_MAPPING: Record<
  TypographyVariant,
  { variant: string; style?: React.CSSProperties }
> = {
  "heading-large": {
    variant: "h2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 600,
      fontStyle: "normal",
      fontSize: "24px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px"
    }
  },
  "heading-medium": {
    variant: "h3",
    style: {
      fontFamily: "Poppins",
      fontWeight: 600,
      fontStyle: "normal",
      fontSize: "21px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px",
      lineHeight: "normal"
    }
  },
  "heading-small": {
    variant: "h4",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "18px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px"
    }
  },
  "heading-micro": {
    variant: "h5",
    style: {
      fontFamily: "Poppins",
      fontWeight: 600,
      fontStyle: "normal",
      fontSize: "16px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px",
      lineHeight: "normal"
    }
  },
  "body-large": {
    variant: "body1",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "16px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.16px",
      lineHeight: "21px"
    }
  },
  "body-medium": {
    variant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "14px",
      letterSpacing: "0.14px",
      lineHeight: "22px"
    }
  },
  "body-small": {
    variant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "12px",
      letterSpacing: "0.12px",
      lineHeight: "normal"
    }
  },
  "body-small-underline": {
    variant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "12px",
      textDecoration: "underline",
      textDecorationStyle: "solid",
      textDecorationSkipInk: "none",
      textDecorationThickness: "auto",
      textUnderlineOffset: "auto",
      textUnderlinePosition: "from-font"
    }
  },
  "body-micro": {
    variant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "10px",
      lineHeight: "normal"
    }
  },
  "mono-medium": {
    variant: "body1",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      fontFeatureSettings: "'liga' off, 'clig' off",
      lineHeight: "21px",
      letterSpacing: "1.32px",
      textTransform: "uppercase"
    }
  },
  "mono-medium-underline": {
    variant: "body1",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      lineHeight: "21px",
      letterSpacing: "1.32px",
      textDecoration: "underline",
      textDecorationStyle: "solid",
      textDecorationSkipInk: "none",
      textDecorationThickness: "auto",
      textUnderlineOffset: "auto",
      textUnderlinePosition: "from-font",
      textTransform: "uppercase"
    }
  },
  "mono-small": {
    variant: "body2",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "10px",
      fontWeight: 500,
      fontStyle: "normal",
      fontFeatureSettings: "'liga' off, 'clig' off",
      lineHeight: "21px",
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    }
  },
  "drawer-title": {
    variant: "subtitle1",
    style: {
      fontFamily: "Poppins",
      fontSize: "14px",
      fontWeight: 600,
      fontStyle: "normal",
      lineHeight: "20px",
      letterSpacing: "0.1px"
    }
  },
  "drawer-label": {
    variant: "body2",
    style: {
      fontFamily: "Poppins",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      lineHeight: "16px",
      letterSpacing: "0.1px"
    }
  }
};

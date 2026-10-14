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
import {
  Typography as PrimitiveTypography,
  type TypographyPropsVariantOverrides,
  type TypographyVariant
} from "@mui/material";

import { type OverridableStringUnion } from "@mui/types";

import { VARIANT_MAPPING, type TypographyProps } from "./typography.variants";

export function Typography(props: TypographyProps) {
  const {
    variant = "body-medium",
    children,
    sx,
    style: inlineStyles,
    color = "inherit",
    ...rest
  } = props;

  const { variant: mui, style } = VARIANT_MAPPING[variant];

  return (
    <PrimitiveTypography
      {...rest}
      sx={sx}
      variant={
        mui as OverridableStringUnion<
          TypographyVariant | "inherit",
          TypographyPropsVariantOverrides
        >
      }
      style={{ ...style, ...inlineStyles }}
      color={color}
    >
      {children}
    </PrimitiveTypography>
  );
}

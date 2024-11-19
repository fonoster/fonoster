import { Typography as MuiTypography } from "@mui/material";
import { TypographyProps } from "./types";
import { variantMapping } from "./variantMapping";

function Typography(props: TypographyProps) {
  const { variant = "body-medium", text } = props;

  const { muiVariant, style } = variantMapping[variant];

  return (
    <MuiTypography variant={muiVariant as any} style={style}>
      {text}
    </MuiTypography>
  );
}

export { Typography };

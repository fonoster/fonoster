import { memo } from "react";
import { Divider as Root } from "@mui/material";
import { Typography } from "../typography/typography";

export const Divider = memo(() => {
  return (
    <Root
      sx={{
        "&.MuiDivider-root": {
          "&:before, &::after": {
            borderColor: "base.05"
          }
        }
      }}
    >
      <Typography variant="body-small" color="base.01">
        Or
      </Typography>
    </Root>
  );
});

Divider.displayName = "Divider";

import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PRODUCT_NAME } from "~/core/brand/product";
import { LogoMark } from "./logo-mark";

export const LogoLarge = memo(() => {
  const theme = useTheme();
  const textColor = theme.palette.mode === "dark" ? "#F4F7FF" : "#0C1018";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <LogoMark size={28} />
      <Typography
        component="span"
        sx={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          fontSize: "18px",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          color: textColor
        }}
      >
        {PRODUCT_NAME}
      </Typography>
    </Box>
  );
});

LogoLarge.displayName = "LogoLarge";

import { Box } from "@mui/material";
import { memo } from "react";

export const FormRoot = memo(function FormRoot({
  children,
  ...props
}: React.PropsWithChildren<React.HTMLProps<HTMLFormElement>>) {
  return (
    <Box
      component="form"
      autoComplete="off"
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      {...props}
    >
      {children}
    </Box>
  );
});

FormRoot.displayName = "FormRoot";

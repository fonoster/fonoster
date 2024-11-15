import * as React from "react";
import Typography from "@mui/material/Typography";

const FTypography = React.forwardRef<HTMLElement>(
  ({ ...props }, _ref) => {
  
    return (
      <Typography variant="h1">
        h1. Heading
      </Typography>
    );
  }
);

FTypography.displayName = "Typography";

export { FTypography };

import * as React from "react";
import { AppBar, Container, Toolbar, Box } from "@mui/material";
import { Logo } from "@/common/components/logo/Logo";
import { ToolbarActions } from "./LayoutWrapper";

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export const SimpleLayout = ({ children }: SimpleLayoutProps) => {
  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "background.paper"
        }}
      >
        <Toolbar
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            pl: 0,
            pr: 0
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
            <Logo size="medium" />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <ToolbarActions />
          </Box>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg">
        {children}
      </Container>
    </>
  );
};

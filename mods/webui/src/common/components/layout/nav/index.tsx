import * as React from "react";
import { IconButton, Stack, useMediaQuery, useTheme, Box } from "@mui/material";
import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import GlobalStyles from "@mui/material/GlobalStyles";
import { Header } from "./header";
import {
  Sidebar as DesktopSidebar,
  MobileNav as MobileSidebar
} from "./sidebar";

export interface SecuredLayoutProps {
  children?: React.ReactNode;
}

export function SecuredLayout({
  children
}: SecuredLayoutProps): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <GlobalStyles
        styles={{
          body: {
            "--MainNav-height": "56px",
            "--MainNav-zIndex": 1000,
            "--SideNav-width": "280px",
            "--SideNav-zIndex": 1100,
            "--MobileNav-width": "320px",
            "--MobileNav-zIndex": 1100
          }
        }}
      />
      <Box
        sx={{
          bgcolor: "var(--mui-palette-background-default)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          minHeight: "100%"
        }}
      >
        {/* Header */}
        <Header
          hamburgerIcon={
            <Stack
              direction="row"
              spacing={2}
              sx={{
                alignItems: "center",
                flex: "1 1 auto",
                display: { lg: "none" }
              }}
            >
              <IconButton
                onClick={(): void => {
                  setOpenNav(true);
                }}
              >
                <ListIcon />
              </IconButton>
            </Stack>
          }
        />
        {/* Sidebar */}
        <Box sx={{ display: "flex", flex: "1 1 auto" }}>
          <MobileSidebar open={openNav} onClose={() => setOpenNav(false)} />
          <DesktopSidebar />
          <Box
            component="main"
            sx={{
              "--Content-margin": "0 auto",
              "--Content-maxWidth": "var(--maxWidth-xl)",
              "--Content-paddingX": "24px",
              "--Content-paddingY": { xs: "24px", lg: "64px" },
              "--Content-padding":
                "var(--Content-paddingY) var(--Content-paddingX)",
              "--Content-width": "100%",
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column"
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </React.Fragment>
  );
}

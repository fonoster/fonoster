import * as React from "react";
import { IconButton, Stack, Box, Container, useTheme } from "@mui/material";
import { List as ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import GlobalStyles from "@mui/material/GlobalStyles";
import { Header } from "./header";
import {
  Sidebar as DesktopSidebar,
  MobileNav as MobileSidebar
} from "./sidebar";

export interface SecuredLayoutProps {
  children?: React.ReactNode;
  showSidebar?: boolean;
}

export function SecuredLayout({
  children,
  showSidebar = true
}: SecuredLayoutProps): React.JSX.Element {
  const [openNav, setOpenNav] = React.useState<boolean>(false);

  const theme = useTheme();

  return (
    <>
      <GlobalStyles
        styles={{
          body: {
            "--MainNav-height": "80px",
            "--MainNav-zIndex": 1000,
            "--SideNav-width": "280px",
            "--SideNav-zIndex": 1100,
            "--MobileNav-width": "320px",
            "--MobileNav-zIndex": 1100,
            margin: 0,
            padding: 0,
            overflowX: "hidden"
          },
          html: {
            boxSizing: "border-box",
            height: "100%",
            overflow: "hidden"
          },
          "*, *:before, *:after": {
            boxSizing: "inherit"
          }
        }}
      />
      <Box
        sx={{
          bgcolor: "var(--mui-palette-background-default)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          height: "100vh",
          width: "100%",
          overflowX: "hidden"
        }}
      >
        {/* Header */}
        <Header
          hamburgerIcon={
            showSidebar ? (
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
            ) : undefined
          }
        />
        <Box
          sx={{
            display: "flex",
            flex: "1 1 auto",
            marginTop: 0,
            width: "100%",
            position: "relative",
            paddingTop: 0,
            height: "calc(100vh - var(--MainNav-height))",
            overflow: "hidden"
          }}
        >
          {showSidebar && (
            <>
              <MobileSidebar open={openNav} onClose={() => setOpenNav(false)} />
              <DesktopSidebar
                sx={{
                  height: "100%",
                  overflow: "hidden",
                  position: { lg: "fixed" },
                  top: { lg: "var(--MainNav-height)" },
                  bottom: { lg: 0 }
                }}
              />
            </>
          )}
          <Box
            component="main"
            sx={{
              "--Content-margin": "0 auto",
              "--Content-maxWidth": "var(--maxWidth-xl)",
              "--Content-paddingX": "24px",
              "--Content-paddingY": { xs: "16px", lg: "24px" },
              "--Content-padding":
                "var(--Content-paddingY) var(--Content-paddingX)",
              "--Content-width": "100%",
              display: "flex",
              flex: "1 1 auto",
              flexDirection: "column",
              width: "100%",
              overflowY: "auto",
              overflowX: "hidden"
            }}
          >
            <Container
              maxWidth={false}
              disableGutters
              sx={{
                flex: 1,
                display: "flex",
                width: "100%",
                maxWidth: "100%",
                "& .MuiContainer-root": {
                  maxWidth: "none",
                  padding: 0,
                  margin: 0
                },
                bgcolor: theme.palette.grey[50]
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  marginTop: { xs: "24px", sm: "44px", md: "64px" },
                  marginLeft: {
                    xs: "24px",
                    sm: "44px",
                    md: "64px",
                    lg: "150px"
                  },
                  marginRight: {
                    xs: "24px",
                    sm: "44px",
                    md: "64px",
                    lg: "150px"
                  },
                  width: "100%"
                }}
              >
                {children}
              </Box>
            </Container>
          </Box>
        </Box>
      </Box>
    </>
  );
}

import { AppBar, Box, Container, Stack, styled } from "@mui/material";
import { Logo } from "@/common/components/logo/Logo";
import { FormProvider, UseFormReturn } from "react-hook-form";
import { Typography } from "@stories/typography/Typography";
import { TypographyVariant } from "@stories/typography/types";

const HEADER_HEIGHT = 75;
const HEADER_TO_CONTENT_SPACING = 44;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: "fixed",
  backgroundColor: theme.palette.background.paper,
  boxShadow: "none",
  borderBottom: "1px solid",
  borderColor: theme.palette.divider,
  height: HEADER_HEIGHT,
  zIndex: theme.zIndex.appBar
}));

export const Header = () => {
  return (
    <StyledAppBar>
      <Container maxWidth="lg" sx={{ height: "100%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%"
          }}
        >
          <Logo size="small" />
        </Box>
      </Container>
    </StyledAppBar>
  );
};

export const PageContainer = styled(Container)(({ theme }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  maxWidth: "100% !important",
  marginTop: HEADER_HEIGHT + HEADER_TO_CONTENT_SPACING,
  padding: theme.spacing(3)
}));

export const Card = styled("form")(({ theme }) => ({
  width: "100%",
  maxWidth: 480,
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  boxShadow: "none",
  padding: theme.spacing(4),
  "&:hover": {
    boxShadow: "none"
  }
}));

interface AuthContentProps {
  title: string;
  description?: string | React.ReactNode;
  descriptionFontSize?: TypographyVariant;
  children: React.ReactNode;
}

export const Content = ({
  title,
  description,
  descriptionFontSize = "body-small",
  children
}: AuthContentProps) => {
  return (
    <>
      <Stack spacing={2} sx={{ width: "100%" }} marginBottom={4}>
        <Typography
          variant="heading-large"
          sx={{
            marginBottom: description ? 10 : 6,
            color: "text.primary",
            textAlign: "center"
          }}
        >
          {title}
        </Typography>
        {typeof description === "string" ? (
          <Typography
            variant={descriptionFontSize}
            sx={{ color: "text.secondary", textAlign: "center" }}
          >
            {description}
          </Typography>
        ) : (
          description
        )}
      </Stack>
      <Stack spacing={3} sx={{ width: "100%" }}>
        {children}
      </Stack>
    </>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  methods: UseFormReturn<any>;
}

export const Layout = ({ children, methods }: LayoutProps) => {
  return (
    <Box
      sx={{
        backgroundColor: "background.default",
        minHeight: "100vh",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}
    >
      <Header />
      <FormProvider {...methods}>{children}</FormProvider>
    </Box>
  );
};

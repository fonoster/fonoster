import { AppBar, Box, Container, Stack, Typography, styled } from '@mui/material';
import { Logo } from '@/common/components/logo/Logo';
import { FormProvider, UseFormReturn } from 'react-hook-form';

const HEADER_HEIGHT = 80;
const HEADER_TO_CONTENT_SPACING = 44;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  position: 'fixed',
  backgroundColor: theme.palette.background.paper,
  boxShadow: 'none',
  borderBottom: '1px solid',
  borderColor: theme.palette.divider,
  height: HEADER_HEIGHT,
  zIndex: theme.zIndex.appBar,
}));

export const Header = () => {
  return (
    <StyledAppBar>
      <Container maxWidth="lg" sx={{ height: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
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
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '100%!important',
  marginTop: HEADER_HEIGHT + HEADER_TO_CONTENT_SPACING,
  padding: theme.spacing(3),
}));

export const Card = styled('form')(({ theme }) => ({
  width: '100%',
  maxWidth: 480,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: 'none',
  padding: theme.spacing(4),
  '&:hover': {
    boxShadow: 'none',
  },
}));

interface AuthContentProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const Content = ({ title, description, children }: AuthContentProps) => {
  return (
    <>
      <Typography
        variant="h5"
        sx={{
          marginBottom: 3,
          fontWeight: 500,
          color: 'text.primary',
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body1"
          sx={{ marginBottom: 4, color: 'text.secondary' }}
        >
          {description}
        </Typography>
      )}
      <Stack spacing={3} sx={{ width: '100%' }}>
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
    <Box sx={{
      backgroundColor: 'background.default',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Header />
      <FormProvider {...methods}>
        {children}
      </FormProvider>
    </Box>
  );
}; 
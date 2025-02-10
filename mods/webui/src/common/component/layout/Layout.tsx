import { Box, Container, styled } from '@mui/material';
import { Logo } from '../logo/Logo';

const HeaderWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: 80,
  backgroundColor: theme.palette.background.paper,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: theme.zIndex.appBar,
  boxShadow: theme.palette.mode === 'light'
    ? '0px 3px 15px rgba(0, 0, 0, 0.1)'
    : '0px 3px 15px rgba(0, 0, 0, 0.4)',
  transition: theme.transitions.create(['box-shadow']),
}));

export const Header = () => {
  return (
    <HeaderWrapper>
      <Logo size="medium" />
    </HeaderWrapper>
  );
};

export const PageContainer = styled(Container)(({ theme }) => ({
  minHeight: `calc(100vh - 80px)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 80,
  maxWidth: '1000px !important',
  padding: theme.spacing(3),
}));

export const Card = styled('form')(({ theme }) => ({
  width: '100%',
  maxWidth: 530,
  padding: theme.spacing(6),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.palette.mode === 'light'
    ? '0px 3px 15px rgba(0, 0, 0, 0.1)'
    : '0px 3px 15px rgba(0, 0, 0, 0.4)',
  transition: theme.transitions.create(['box-shadow']),
  '&:hover': {
    boxShadow: theme.palette.mode === 'light'
      ? '0px 4px 20px rgba(0, 0, 0, 0.15)'
      : '0px 4px 20px rgba(0, 0, 0, 0.5)',
  },
}));

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
}; 
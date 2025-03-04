import { useState, useEffect } from 'react';
import {
  Box,
  Divider,
  Link,
  Stack,
  useTheme,

} from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';
import { Layout, PageContainer, Card, Content } from '@/common/components/layout/noAuth/Layout';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';
import { Button } from '@stories/button/Button';
import { InputText } from '@stories/inputtext/InputText';
import { AuthProvider } from '@/common/sdk/provider/FonosterContext';
import { OAuthConfig, OAuthResponse } from '@/types/oauth';
import { Icon } from '@stories/icon/Icon';
import { Typography } from '@stories/typography/Typography';

interface LoginForm {
  email: string;
  password: string;
}

const GITHUB_CONFIG: OAuthConfig = {
  clientId: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
  redirectUri: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_REDIRECT_URI!,
  redirectUriCallback: process.env.NEXT_PUBLIC_FRONTEND_URL! + '/signin',
  scope: process.env.NEXT_PUBLIC_GITHUB_SIGNIN_SCOPE!,
  authUrl: process.env.NEXT_PUBLIC_GITHUB_URL!
};

const LoginPage = () => {
  const theme = useTheme();
  const router = useRouter();
  const { authentication } = useFonosterClient();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const methods = useForm<LoginForm>({
    defaultValues: {
      email: 'wandyhernandez86@gmail.com',
      password: 'Ww@12345678'
    }
  });

  const {
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid }
  } = methods;

  useEffect(() => {
    if (!router.isReady) return;
    const { code, state } = router.query;
    if (!code || !state) return;

    let provider: string;
    try {
      const decoded = JSON.parse(decodeURIComponent(state as string));
      provider = decoded.provider;
    } catch (error) {
      console.error('Error decoding state', error);
      provider = '';
    }

    const oauthResponse: OAuthResponse = {
      code: code as string,
      provider: provider,
    };
    handleOAuthCallback(oauthResponse);
  }, [router.isReady, router.query]);

  const handleOAuthCallback = async (oauthResponse: OAuthResponse) => {
    if (isRedirecting) return;
    try {
      setIsRedirecting(true);
      await authentication.signIn({
        credentials: { username: '', password: '' },
        provider: oauthResponse.provider as AuthProvider,
        oauthCode: oauthResponse.code
      });
      await router.replace(GITHUB_CONFIG.redirectUri);
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleGitHubSignIn = () => {
    const stateData = {
      provider: AuthProvider.GITHUB,
      nonce: Math.random().toString(36).substring(2),
    };
    const stateEncoded = encodeURIComponent(JSON.stringify(stateData));
    const authUrl = `${GITHUB_CONFIG.authUrl}?client_id=${GITHUB_CONFIG.clientId}&redirect_uri=${encodeURIComponent(GITHUB_CONFIG.redirectUriCallback)}&scope=${GITHUB_CONFIG.scope}&state=${stateEncoded}`;
    window.location.href = authUrl;
  };

  const onSubmit = async (data: LoginForm) => {
    if (isRedirecting) return;
    try {
      setIsRedirecting(true);
      await authentication.signIn({
        credentials: { username: data.email, password: data.password },
        provider: AuthProvider.CREDENTIALS,
        oauthCode: ''
      });
      await router.replace('/workspace/');
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    } finally {
      setIsRedirecting(false);
    }
  };

  const handleSignUpClick = () => {
    router.push('/signup');
  };

  return (
    <Layout methods={methods}>
      <PageContainer>
        <Card onSubmit={handleSubmit(onSubmit)}>
          <Content title="Sign In">
            <InputText
              name="email"
              label="Email Address"
              type="email"
              error={!!errors.email}
              supportingText={errors.email?.message || 'Please enter your email address'}
              shrink

            />
            <InputText
              name="password"
              label="Password"
              type="password"
              error={!!errors.password}
              supportingText={errors.password?.message || 'Please enter your password'}
              shrink
            />
            <Box sx={{ textAlign: 'right', mb: 2 }}>
              <Link href="/forgot-password" color="inherit" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body-small-underline"
                >
                  Forgot password?
                </Typography>
              </Link>
            </Box>
            {errors.root && errors.root.message && (
              <Typography
                variant="body-small"
                color="error"
              >
                {errors.root.message}
              </Typography>
            )}
            <Button
              onClick={handleSubmit(onSubmit)}
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isRedirecting || !isValid}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
            <Divider>
              <Typography
                variant="body-small"
                color="text.secondary"
              >
                Or
              </Typography>
            </Divider>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GitHubIcon />}
              onClick={handleGitHubSignIn}
              disabled={isRedirecting}
            >
              Sign in with GitHub
            </Button>
            <Box sx={{ textAlign: 'center' }}>

              <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.3}>
                <Typography
                  variant="body-small"
                  color="text.secondary"
                >
                  Don't have an account?
                </Typography>
                <Typography
                  variant="body-small"
                  onClick={handleSignUpClick}
                >
                  Sign up
                </Typography>
                <Link href="/signup" color="inherit" style={{ textDecoration: 'none' }}><Typography variant="body-small-underline" color="primary">here</Typography></Link>
              </Stack>

            </Box>
          </Content>
        </Card>
      </PageContainer>
    </Layout >
  );
};

export default LoginPage;

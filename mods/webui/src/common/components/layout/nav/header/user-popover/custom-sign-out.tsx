'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import MenuItem from '@mui/material/MenuItem';

// import { authClient } from '@/lib/auth/custom/client';
// import { logger } from '@/lib/default-logger';
// import { useUser } from '@/hooks/use-user';
// import { toast } from '@/components/core/toaster';

export function CustomSignOut(): React.JSX.Element {
  // const { checkSession, logout } = useUser();

  const router = useRouter();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      // await logout();
      // const { error } = await authClient.signOut();

      // if (error) {
      //   logger.error('Sign out error', error);
      //   toast.error('Something went wrong, unable to sign out');
      //   return;
      // }

      // // Refresh the auth state
      // await checkSession?.();

      // // UserProvider, for this case, will not refresh the router and we need to do it manually
      // router.refresh();
      // After refresh, AuthGuard will handle the redirect
    } catch (err) {
      // logger.error('Sign out error', err);
      // toast.error('Something went wrong, unable to sign out');
    }
  }, [
    // checkSession, router, logout
  ]);

  return (
    <MenuItem component="div" onClick={handleSignOut} sx={{ justifyContent: 'center' }}>
      Salir
    </MenuItem>
  );
}

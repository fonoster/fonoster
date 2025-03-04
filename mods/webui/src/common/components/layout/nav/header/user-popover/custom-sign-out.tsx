'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import MenuItem from '@mui/material/MenuItem';
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';

// import { authClient } from '@/lib/auth/custom/client';
// import { logger } from '@/lib/default-logger';
// import { useUser } from '@/hooks/use-user';
// import { toast } from '@/components/core/toaster';

export function CustomSignOut(): React.JSX.Element {
  // const { checkSession, logout } = useUser();
  const { authentication } = useFonosterClient();

  const router = useRouter();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    try {
      authentication.signOut();
    } catch (err) {
      // logger.error('Sign out error', err);
      // toast.error('Something went wrong, unable to sign out');
    }
  }, [
    // checkSession, router, logout
  ]);

  return (
    <MenuItem component="div" onClick={handleSignOut} sx={{ justifyContent: 'center' }}>
      Logout
    </MenuItem>
  );
}

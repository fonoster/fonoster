'use client';

export const stringAvatar = (name: string) => {
  const splitName = name.split(' ');
  const initials = splitName.reduce((acc, curr) => acc + curr[0], '');
  return {
    sx: {
      bgcolor: 'info.main',
    },
    children: initials,
  };
};


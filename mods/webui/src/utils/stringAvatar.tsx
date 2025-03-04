"use client";

export const stringAvatar = (name: string) => {
  const splitName = name.split(" ");
  const initials = splitName.reduce((acc, curr) => acc + curr[0], "");
  return {
    sx: {
      bgcolor: "#00ab5514",
      color: "#00ab55",
      fontWeight: "bold"
    },
    children: initials
  };
};

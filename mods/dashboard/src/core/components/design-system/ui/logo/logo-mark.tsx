import { memo } from "react";

export const LogoMark = memo(({ size = 28 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect width="32" height="32" rx="9" fill="#4C6FFF" />
    <path
      d="M8 16.5v-1M11.5 20V12M15 22.5V9.5M18.5 20V12M22 16.5v-1"
      stroke="#F4F7FF"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
));

LogoMark.displayName = "LogoMark";

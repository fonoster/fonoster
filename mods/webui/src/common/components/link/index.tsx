import { Typography } from "@stories/typography/Typography";
import NextLink from "next/link";

export const Link = ({ label, href }: { label: string; href: string }) => {
  return (
    <NextLink href={href} style={{ textDecoration: "none", color: "inherit" }}>
      <Typography variant="body-small-underline">{label}</Typography>
    </NextLink>
  );
};

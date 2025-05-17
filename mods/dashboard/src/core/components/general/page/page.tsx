import { Container, styled } from "@mui/material";
import type { HTMLAttributes, ReactNode } from "react";

export type PageVariants = "default" | "form";

export interface PageProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PageVariants;
  children: ReactNode;
}

export const Page = ({
  variant = "default",
  children,
  ...props
}: PageProps) => {
  return (
    <PageRoot variant={variant}>
      <PageContent variant={variant} {...props}>
        {children}
      </PageContent>
    </PageRoot>
  );
};

const PageRoot = styled("div")<{ variant: PageVariants }>(
  ({ theme, variant }) => ({
    width: "100%",
    height: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    backgroundColor:
      variant === "form"
        ? theme.palette.base["07"]
        : theme.palette.background.default
  })
);

const PageContent = styled(Container)<{ variant: PageVariants }>(
  ({ theme, variant }) => ({
    width: "100%",
    minHeight: "100%",
    maxWidth: "924px !important",
    padding: variant === "form" ? theme.spacing(5, 3) : theme.spacing(9, 3)
  })
);

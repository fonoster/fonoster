import { forwardRef } from "react";
import { Link as Root, type LinkProps } from "react-router";

export const Link = forwardRef(function Link(
  { children, ...props }: Omit<LinkProps, "viewTransition">,
  ref: React.ForwardedRef<HTMLAnchorElement>
) {
  return (
    <Root ref={ref} {...props} style={{ color: "inherit" }} viewTransition>
      {children}
    </Root>
  );
});

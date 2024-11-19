type TypographyVariant = 
  "heading-large"  | 
  "heading-medium" |
  "heading-small"  |
  "body-large"     |
  "body-medium"    |
  "body-small"     |
  "body-small-underline" |
  "body-micro"     |
  "mono-medium"    |
  "mono-medium-underline" |
  "mono-small"     |
  "drawer-title"   |
  "drawer-label";

type TypographyProps = {
  variant?: TypographyVariant;
  text: string;
};

export type { TypographyProps, TypographyVariant };
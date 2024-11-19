import { TypographyVariant } from "./types";

const variantMapping: Record<TypographyVariant, { muiVariant: string; style?: React.CSSProperties }> = {
  "heading-large": { muiVariant: "h2", style: { fontFamily: "Poppins", fontWeight: 700 } },
  "heading-medium": { muiVariant: "h3", style: { fontFamily: "Poppins", fontWeight: 600 } },
  "heading-small": { muiVariant: "h4", style: { fontFamily: "Poppins", fontWeight: 500 } },
  "body-large": { muiVariant: "body1", style: { fontSize: "18px" } },
  "body-medium": { muiVariant: "body2", style: { fontSize: "16px" } },
  "body-small": { muiVariant: "body2", style: { fontSize: "14px" } },
  "body-small-underline": { muiVariant: "body2", style: { fontSize: "14px", textDecoration: "underline" } },
  "body-micro": { muiVariant: "caption", style: { fontSize: "12px" } },
  "mono-medium": { muiVariant: "body1", style: { fontFamily: "monospace", fontSize: "16px" } },
  "mono-medium-underline": { muiVariant: "body1", style: { fontFamily: "monospace", fontSize: "16px", textDecoration: "underline" } },
  "mono-small": { muiVariant: "body2", style: { fontFamily: "monospace", fontSize: "14px" } },
  "drawer-title": { muiVariant: "subtitle1", style: { fontWeight: 600 } },
  "drawer-label": { muiVariant: "body2", style: { fontWeight: 500 } }
};

export { variantMapping };
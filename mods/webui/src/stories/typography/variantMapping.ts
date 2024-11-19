import { TypographyVariant } from "./types";

const variantMapping: Record<
  TypographyVariant,
  { muiVariant: string; style?: React.CSSProperties }
> = {
  "heading-large": {
    muiVariant: "h2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 600,
      fontStyle: "normal",
      fontSize: "24px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px"
    }
  },
  "heading-medium": {
    muiVariant: "h3",
    style: {
      fontFamily: "Poppins",
      fontWeight: 600,
      fontStyle: "normal",
      fontSize: "21px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px",
      lineHeight: "21px"
    }
  },
  "heading-small": {
    muiVariant: "h4",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "18px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.5px"
    }
  },
  "body-large": {
    muiVariant: "body1",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "16px",
      fontFeatureSettings: "'liga' off, 'clig' off",
      letterSpacing: "0.16px",
      lineHeight: "21px"
    }
  },
  "body-medium": {
    muiVariant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "14px",
      letterSpacing: "0.14px",
      lineHeight: "22px"
    }
  },
  "body-small": {
    muiVariant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "12px",
      letterSpacing: "0.12px",
      lineHeight: "normal"
    }
  },
  "body-small-underline": {
    muiVariant: "body2",
    style: {
      fontFamily: "Poppins",
      fontWeight: 400,
      fontStyle: "normal",
      fontSize: "12px",
      textDecoration: "underline",
      textDecorationStyle: "solid",
      textDecorationSkipInk: "none",
      textDecorationThickness: "auto",
      textUnderlineOffset: "auto",
      textUnderlinePosition: "from-font"
    }
  },
  "body-micro": {
    muiVariant: "caption",
    style: {
      fontFamily: "Poppins",
      fontWeight: 500,
      fontStyle: "normal",
      fontSize: "10px",
      lineHeight: "normal"
    }
  },
  "mono-medium": {
    muiVariant: "body1",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      fontFeatureSettings: "'liga' off, 'clig' off",
      lineHeight: "21px",
      letterSpacing: "1.32px",
      textTransform: "uppercase"
    }
  },
  "mono-medium-underline": {
    muiVariant: "body1",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      lineHeight: "21px",
      letterSpacing: "1.32px",
      textDecoration: "underline",
      textDecorationStyle: "solid",
      textDecorationSkipInk: "none",
      textDecorationThickness: "auto",
      textUnderlineOffset: "auto",
      textUnderlinePosition: "from-font",
      textTransform: "uppercase"
    }
  },
  "mono-small": {
    muiVariant: "body2",
    style: {
      fontFamily: "Roboto Mono",
      fontSize: "10px",
      fontWeight: 500,
      fontStyle: "normal",
      fontFeatureSettings: "'liga' off, 'clig' off",
      lineHeight: "21px",
      letterSpacing: "0.5px",
      textTransform: "uppercase"
    }
  },
  "drawer-title": {
    muiVariant: "subtitle1",
    style: {
      fontFamily: "Poppins",
      fontSize: "14px",
      fontWeight: 600,
      fontStyle: "normal",
      lineHeight: "20px",
      letterSpacing: "0.1px"
    }
  },
  "drawer-label": {
    muiVariant: "body2",
    style: {
      fontFamily: "Poppins",
      fontSize: "11px",
      fontWeight: 500,
      fontStyle: "normal",
      lineHeight: "16px",
      letterSpacing: "0.1px"
    }
  }
};

export { variantMapping };

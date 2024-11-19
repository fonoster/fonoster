import { createTheme } from "@mui/material/styles";

const fnLight = createTheme({
  palette: {
    primary: {
      "50": "#FFFFFF",
      "100": "#E6FFF5",
      "200": "#CCEFE1",
      "500": "#39E19E",
      "700": "#008751",
      "800": "#053204",
      "900": "#011900"
    },
    text: {
      primary: "#555"
    }
  },
  shape: {
    borderRadius: 40
  }
});

export { fnLight };

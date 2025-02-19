import { styled } from "@mui/material/styles";
import { Select } from "@mui/material";

export const StyledSelect = styled(Select)(({ theme }) => ({
  "& .MuiInputBase-root": {
    height: "56px",
  },
  "& .MuiSelect-select": {
    minHeight: "auto",
    padding: "16.5px 14px",
    fontSize: "14px",
    fontFamily: theme.typography.fontFamily,
    fontWeight: 400,
    lineHeight: "1.4375em",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[300],
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: `${theme.palette.primary.main} !important`,
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: `${theme.palette.primary.main} !important`,
    borderWidth: "2px"
  },
  "& .MuiInputLabel-root": {
    transform: "translate(14px, 16px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)"
    },
    "&.Mui-focused": {
      color: theme.palette.primary.main
    }
  },
  "& + .MuiMenu-paper": {
    "& .MuiMenuItem-root": {
      fontSize: "14px",
      padding: "6px 14px",
      minHeight: "auto"
    }
  },
  "& .MuiFormHelperText-root": {
    marginLeft: "3px",
    fontSize: "0.75rem"
  }
})); 
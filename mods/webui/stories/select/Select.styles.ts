import { styled } from "@mui/material/styles";
import { Select } from "@mui/material";

export const StyledSelect = styled(Select)(({ theme }) => ({
  "& .MuiInputBase-root": {
    minHeight: "42px",
    height: "auto",
  },
  "& .MuiOutlinedInput-input": {
    padding: "16.5px 14px",
  },
  "& .MuiSelect-select": {
    minHeight: "auto",
    fontSize: "12px",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 400,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "4px",
    padding: "8px 14px",
    "& .MuiChip-root": {
      margin: "2px",
      pointerEvents: "auto",
      "& .MuiChip-deleteIcon": {
        pointerEvents: "auto",
        cursor: "pointer",
        "&:hover": {
          color: theme.palette.error.main,
        },
      },
    },
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.grey[300],
    borderWidth: "1px",
    borderRadius: "4px",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
    borderWidth: "2px"
  },
  "& .MuiInputLabel-root": {
    transform: "translate(14px, 16px) scale(1)",
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 500,
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -9px) scale(0.75)"
    },
    "&.Mui-focused": {
      color: theme.palette.primary.main
    }
  },
  "& + .MuiMenu-paper": {
    marginTop: "4px",
    "& .MuiMenuItem-root": {
      fontSize: "12px",
      fontFamily: "'Poppins', sans-serif",
      padding: "6px 14px",
      minHeight: "32px"
    }
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Poppins', sans-serif",
    fontSize: "10px",
    fontWeight: 500,
    lineHeight: "normal",
    letterSpacing: "0.12px",
    marginTop: "4px",
    marginLeft: "3px",
    color: theme.palette.text.primary
  },
  "& .MuiInputAdornment-root": {
    color: theme.palette.text.primary,
    marginRight: "8px",
    "& .MuiSvgIcon-root": {
      fontSize: "20px"
    }
  }
}));
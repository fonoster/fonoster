import MuiTextField from "@mui/material/TextField";
import { styled } from "@mui/material";

export const StyledInput = styled(MuiTextField)(({ theme }) => ({
    "& .MuiInputBase-root": {
        borderRadius: "4px",
    },
    "& .MuiInputBase-input": {
        padding: "6px 16px",
        height: "28px",
    },
    // transform the label position 16px 8px add style to the label
    "& .MuiFormLabel-root.MuiInputLabel-root": {
        transform: "translate(16px, 8px) scale(1)",
    },
    "& .MuiFormLabel-root.MuiInputLabel-root.Mui-focused": {
        transform: "translate(14px, -9px) scale(0.75)",
    },
    // when MuiFormLabel-filled .MuiFormLabel-root-MuiInputLabel-root.Mui-focused
    "& .MuiFormLabel-root.MuiInputLabel-root.MuiInputLabel-shrink": {
        transform: "translate(16px, -9px) scale(0.75)",
        color: "rgba(0, 0, 0, 0.6)"
    },
    // add styles for  MuiInputBase-inputAdornedStart
    "& .MuiInputBase-inputAdornedStart": {
        paddingLeft: "0",
    },
    "& .MuiInputBase-root.MuiOutlinedInput-root": {
        "& .MuiInputAdornment-root": {
            marginRight: 4,
        }
    }
}));
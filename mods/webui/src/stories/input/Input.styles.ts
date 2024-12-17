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
    // when MuiFormLabel-filled
    "& .MuiFormLabel-root.MuiInputLabel-root.MuiInputLabel-shrink": {
        transform: "translate(16px, -9px) scale(0.75)",
    },
}));
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";

export const StyledMuiChip = styled(Chip)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  borderRadius: 8,
  size: "medium",
  fontWeight: 500,
  backgroundColor: theme.palette.primary[200],
  color: theme.palette.text.primary, 
  "& .MuiChip-label": {
    color: theme.palette.secondary[800],
  },
  "& .MuiChip-deleteIcon": {
    color: theme.palette.primary,
  },
  "&:hover": {
    backgroundColor: theme.palette.primary[500], 
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.secondary[100],
    color: theme.palette.secondary[500],
    pointerEvents: "none",
  },
}));


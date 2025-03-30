"use client";
import { Paper, styled } from "@mui/material";

export const StyledTable = styled(Paper)(({ theme }) => ({
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
  boxShadow: "none",
  overflow: "hidden",
  "& table": {
    borderCollapse: "collapse",
    width: "100%",
    "& thead": {
      backgroundColor: "#F8F9FA",
      "& th": {
        padding: "6px 16px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#212529",
        borderBottom: "1px solid #DEE2E6",
        textAlign: "left",
        "&:first-of-type": {
          paddingLeft: "16px"
        },
        "&:last-of-type": {
          paddingRight: "16px"
        }
      }
    },
    "& tbody": {
      "& td": {
        padding: "6px 16px",
        fontSize: "14px",
        color: "#212529",
        borderBottom: "1px solid #DEE2E6",
        "&:first-of-type": {
          paddingLeft: "16px"
        },
        "&:last-of-type": {
          paddingRight: "16px"
        }
      },
      "& tr": {
        "&:hover": {
          backgroundColor: "#F8F9FA"
        }
      }
    }
  }
}));

import React from "react";
import {
  StyledTerms,
  StyledTitleContainer,
  StyledCloseButtonContainer,
  StyledTitle,
  StyledMessage
} from "./Terms.styles";
import Grow from "@mui/material/Grow";
import { TermsProps } from "./types";
import CloseIcon from "@mui/icons-material/Close";

export const Terms: React.FC<TermsProps> = ({ message, open, onClose }) => {
  return (
    <Grow in={open}>
      <StyledTerms>
        <StyledTitleContainer>
          <StyledTitle>Terms and Conditions</StyledTitle>
          <StyledCloseButtonContainer onClick={onClose}>
            <CloseIcon htmlColor="#333333" />
          </StyledCloseButtonContainer>
        </StyledTitleContainer>
        <StyledMessage>{message}</StyledMessage>
      </StyledTerms>
    </Grow>
  );
};

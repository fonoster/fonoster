import React, { useState } from "react";
import { Grow, Modal, Typography, Button, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TermsProps } from "./types";
import {
  StyledTerms,
  StyledTitleContainer,
  StyledTitle,
  StyledMessage,
  StyledCloseButtonContainer
} from "./Terms.styles";

export const Terms: React.FC<TermsProps> = ({
  title = "Terms and Conditions",
  message,
  open,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <Grow in={open}>
      <div>
        <Button onClick={handleOpen}>{title}</Button>
        <Modal
          open={isOpen}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
          sx={{ outline: "none" }}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: "rgba(230, 255, 245, 0.75)"
              }
            }
          }}
        >
          <Box sx={StyledTerms}>
            <StyledTitleContainer>
              <Typography id="modal-modal-title" sx={StyledTitle}>
                {title}
              </Typography>
              <StyledCloseButtonContainer onClick={onClose}>
                <CloseIcon htmlColor="#333333" />
              </StyledCloseButtonContainer>
            </StyledTitleContainer>
            <Typography id="modal-modal-description" sx={StyledMessage}>
              {message}
            </Typography>
          </Box>
        </Modal>
      </div>
    </Grow>
  );
};

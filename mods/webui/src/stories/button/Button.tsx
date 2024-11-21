import { StyledMuiButton } from "./styles";
import { ButtonProps } from "./types";

export const Button = (props: ButtonProps) => {
  const { variant, fullWidth, disabled, startIcon, endIcon, children, onClick } = props;

  return (
    <StyledMuiButton
      variant={variant || "contained"}
      fullWidth={fullWidth}
      disabled={disabled}
      startIcon={startIcon}
      endIcon={endIcon}
      onClick={onClick}
      disableElevation
    >
      {children}
    </StyledMuiButton>
  );
};

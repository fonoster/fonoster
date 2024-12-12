import  { useEffect, useState } from "react";
import { StyledMuiChip } from "./Chip.styles";
import { ChipProps } from "./types";
import CloseIcon from '@mui/icons-material/Close';

export const Chip = (props: ChipProps) => {
  const { label, onRemove, enabled } = props;

  return <StyledMuiChip 
   label = {label}
   onDelete = {onRemove}
   disabled = {!enabled}
   deleteIcon = {<CloseIcon />}
  />;
};

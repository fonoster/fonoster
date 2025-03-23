import React, { useEffect, useRef, memo } from "react";
import { Checkbox, CheckboxProps } from "@mui/material";

interface IndeterminateCheckboxProps
  extends Omit<CheckboxProps, "indeterminate"> {
  indeterminate?: boolean;
}

const IndeterminateCheckbox: React.FC<IndeterminateCheckboxProps> = ({
  indeterminate = false,
  ...rest
}) => {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [indeterminate, rest.checked]);

  return (
    <Checkbox
      inputRef={ref}
      size="small"
      sx={{
        padding: 0
      }}
      {...rest}
      disableRipple
    />
  );
};

export default memo(IndeterminateCheckbox, (prevProps, nextProps) => {
  return (
    prevProps.checked === nextProps.checked &&
    prevProps.indeterminate === nextProps.indeterminate &&
    prevProps.disabled === nextProps.disabled
  );
});

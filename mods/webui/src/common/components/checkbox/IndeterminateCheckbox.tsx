import React, { useEffect, useRef } from "react";
import { Checkbox, CheckboxProps } from "@mui/material";

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, "indeterminate"> {
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
  }, [ref, indeterminate, rest.checked]);

  return <Checkbox inputRef={ref} size="small" {...rest} />;
};

export default IndeterminateCheckbox;

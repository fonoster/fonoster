import { ReactNode } from "react";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  defaultValue?: string | number | Array<string | number>;
  supportingText?: string;
  value?: string | number | Array<string | number>;
  onChange?: (event: { target: { value: string | number | Array<string | number> } }) => void;
  error?: boolean;
  options?: SelectOption[];
  inputRef?: any;
  name?: string;
  fullWidth?: boolean;
  multiple?: boolean;
  size?: "small" | "medium";
  [key: string]: any;
} 

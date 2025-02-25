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
  defaultValue?: string | number;
  supportingText?: string;
  value?: string | number;
  onChange?: (event: any) => void;
  error?: boolean;
  options: SelectOption[];
  inputRef?: React.Ref<any>;
  name?: string;
  [key: string]: any;
} 
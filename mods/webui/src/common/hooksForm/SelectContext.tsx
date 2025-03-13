import { useFormContext } from "react-hook-form";
import { Select } from "@stories/select/Select";
import { ReactNode } from "react";

interface option {
  value: string | number;
  label: string;
}

interface SelectContextProps {
  name: string;
  label: string;
  options: Array<option>;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  disabled?: boolean;
  defaultValue?: option;
  id: string;
}

const SelectContext = ({
  name,
  label,
  options,
  leadingIcon,
  trailingIcon,
  disabled = false,
  defaultValue = { value: "", label: "" },
  id
}: SelectContextProps) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext();

  const getNestedError = (name: string) => {
    if (!name.includes('.')) return errors[name];

    const parts = name.split('.');
    let error = errors as any;

    for (const part of parts) {
      if (!error || !error[part]) return undefined;
      error = error[part];
    }

    return error;
  };

  const error = getNestedError(name);

  const { ref, onChange, onBlur, name: fieldName } = register(name);
  const fieldValue = watch(name);

  return (
    <Select
      id={id}
      label={label}
      error={!!error}
      supportingText={error?.message?.toString() || ""}
      options={options}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      disabled={disabled}
      name={fieldName}
      ref={ref}
      onBlur={onBlur}
      onChange={onChange}
      value={fieldValue || defaultValue.value}
    />
  );
};

export { SelectContext };

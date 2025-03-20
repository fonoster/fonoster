import React from "react";

import { Controller, useFormContext } from "react-hook-form";
import { InputText } from "@stories/inputtext/InputText";
import { Select } from "@stories/select/Select";

export interface ChipData<T = any> {
  value: T;
  label: string;
}

interface ChipsContextProps<T = any> {
  name: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  description?: string;
  transformValue?: (value: T) => ChipData<T>;
  getSelectOptions?: (values: ChipData<T>[]) => { value: any; label: string }[];
  onAdd?: (value: T) => void;
}

export function ChipsContext<T = any>({
  name,
  label,
  placeholder = "",
  disabled = false,
  error = false,
  helperText,
  transformValue = (value) => ({ value, label: String(value) }),
  getSelectOptions = (values) =>
    values.map((v) => ({ value: v.value, label: v.label })),
  onAdd
}: ChipsContextProps<T>) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({
        field: { value = [], onChange: fieldOnChange },
        fieldState: { error: fieldError }
      }) => {
        const showError = error || !!fieldError;
        const errorMessage = helperText || fieldError?.message;

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          if (newValue) {
            const chipData = transformValue(newValue as unknown as T);
            const newChips = [...value, chipData];
            fieldOnChange(newChips);
            onAdd?.(newValue as unknown as T);
          }
        };

        return (
          <>
            {value.length > 0 ? (
              <Select
                label={label}
                value={value.map((v) => v.value)}
                disabled={disabled}
                error={showError}
                supportingText={errorMessage}
                multiple
                options={getSelectOptions(value)}
                onChange={(e) => {
                  const selectedValues = e.target.value as any[];
                  const newChips = value.filter((chip: ChipData<T>) =>
                    selectedValues.includes(chip.value)
                  );
                  fieldOnChange(newChips);
                }}
              />
            ) : (
              <InputText
                label={label}
                placeholder={placeholder}
                disabled={disabled}
                error={showError}
                supportingText={errorMessage}
                shrink
                onChange={handleInputChange}
              />
            )}
          </>
        );
      }}
    />
  );
}

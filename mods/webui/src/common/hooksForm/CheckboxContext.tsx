import { useFormContext } from "react-hook-form";
import { Checkbox } from "../../../stories/checkbox/Checkbox";

const CheckboxContext = ({ name, label }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <Checkbox
      {...register(name)}
      error={!!errors[name]}
    >
      {label}
    </Checkbox>
  );
};

export { CheckboxContext };

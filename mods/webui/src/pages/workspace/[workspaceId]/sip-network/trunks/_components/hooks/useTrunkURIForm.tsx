import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
export enum Transport {
  UDP = "UDP",
  TCP = "TCP",
  TLS = "TLS",
  SCTP = "SCTP",
  WS = "WS",
  WSS = "WSS"
}

export const trunkURISchema = z.object({
  host: z
    .string()
    .min(1, "Host is required")
    .refine(
      (value) => {
        const ipv4Pattern =
          /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Pattern =
          /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}$/;
        const hostnamePattern =
          /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

        return (
          ipv4Pattern.test(value) ||
          ipv6Pattern.test(value) ||
          hostnamePattern.test(value)
        );
      },
      { message: "Must be a valid IP address or hostname" }
    ),
  port: z
    .number()
    .int()
    .min(1, "Port must be a positive number")
    .max(65535, "Port must be less than 65536"),
  transport: z.nativeEnum(Transport),
  user: z.string().optional(),
  weight: z
    .number()
    .int()
    .min(0, "Weight must be a positive number")
    .default(10),
  priority: z
    .number()
    .int()
    .min(0, "Priority must be a positive number")
    .default(1),
  enabled: z.boolean().default(true)
});

export type TrunkURIFormData = z.infer<typeof trunkURISchema>;

export const TRUNK_URI_DEFAULTS: TrunkURIFormData = {
  host: "",
  port: 5060,
  transport: Transport.UDP,
  user: undefined,
  weight: 10,
  priority: 1,
  enabled: true
};

export interface TrunkURIFormOptions {
  initialData?: TrunkURIFormData;
  onSuccess?: (uri: TrunkURIFormData) => void;
}

/**
 * Custom hook to manage the SIP URI form for trunks
 *
 * This hook provides validation and submission functionality for the form
 */
export const useTrunkURIForm = ({
  initialData,
  onSuccess
}: TrunkURIFormOptions = {}) => {
  const methods = useForm<TrunkURIFormData>({
    resolver: zodResolver(trunkURISchema),
    defaultValues: initialData || TRUNK_URI_DEFAULTS,
    mode: "onChange"
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid, errors }
  } = methods;

  /**
   * Handles form submission
   */
  const onSubmit = handleSubmit((data) => {
    if (onSuccess) {
      onSuccess(data);
    }
  });

  return {
    methods,
    isValid,
    onSubmit,
    reset
  };
};

import { QueryClient } from "./query-client/query-client.provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <QueryClient>{children}</QueryClient>;
};

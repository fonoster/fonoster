import { QueryClient } from "./query-client/query-client.provider";
import { ThemeProvider } from "./styling/mui.provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <QueryClient>{children}</QueryClient>
    </ThemeProvider>
  );
};

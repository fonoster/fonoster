import { useRouter } from "next/router";
import { Box } from "@mui/material";
import { SecuredLayout } from "../nav";

const SIMPLE_LAYOUT_ROUTES = [
  "/workspace",
  "/workspace/create",
  "/personal/settings"
];

export function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const useSimpleLayout = SIMPLE_LAYOUT_ROUTES.includes(router.pathname);
  return (
    <>
      <Box
        sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <SecuredLayout showSidebar={!useSimpleLayout}>{children}</SecuredLayout>
      </Box>
    </>
  );
}

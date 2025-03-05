import { Box, Typography } from "@mui/material";
import { Hub, Router } from "@mui/icons-material";
import { useRouter } from "next/router";
import { Button } from "@mui/material";

const NotFound = () => {
  const router = useRouter();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        backgroundColor: "#f8f9fa",
        padding: 3
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3
        }}
      >
        <Hub sx={{ fontSize: 40, color: "primary.main" }} />
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "3rem", md: "4rem" },
            background: "linear-gradient(45deg, #00A76F 30%, #28BC89 90%)",
            backgroundClip: "text",
            textFillColor: "transparent",
            fontWeight: "bold"
          }}
        >
          404
        </Typography>
        <Router sx={{ fontSize: 40, color: "primary.main" }} />
      </Box>

      <Typography
        variant="h4"
        sx={{
          mb: 2,
          color: "#334155",
          fontWeight: 500,
          textAlign: "center"
        }}
      >
        Not Found
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 4,
          maxWidth: 600,
          color: "#64748b",
          textAlign: "center"
        }}
      >
        We couldn't find the requested resource on our network. Please check the
        address or return to the main dashboard.
      </Typography>

      <Button variant="contained" size="large" onClick={() => router.push("/")}>
        Back to workspaces
      </Button>
    </Box>
  );
};

NotFound.getLayout = (page: React.ReactElement) => page;

export default NotFound;

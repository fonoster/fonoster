import { Box, Button, Typography, styled } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { LogoMark } from "~/core/components/design-system/ui/logo/logo-mark";

const FeaturedRoot = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.base["07"]}`,
  background:
    "linear-gradient(165deg, rgba(76,111,255,0.22) 0%, #141A24 42%, #0C1018 100%)",
  borderRadius: 24,
  padding: "32px 28px",
  minHeight: 420,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  textAlign: "left",
  color: "inherit",
  boxSizing: "border-box"
}));

const CompactRoot = styled("button")(({ theme }) => ({
  appearance: "none",
  border: `1px solid ${theme.palette.base["07"]}`,
  background: theme.palette.bg.muted,
  borderRadius: 16,
  padding: "16px 18px",
  minHeight: 92,
  width: "100%",
  display: "flex",
  alignItems: "center",
  gap: 14,
  cursor: "pointer",
  color: "inherit",
  textAlign: "left",
  transition: "border-color 0.2s ease, background-color 0.2s ease",
  "&:hover": {
    borderColor: theme.palette.brand.main,
    background: "#1F2838"
  }
}));

const CreateRoot = styled("button")(({ theme }) => ({
  appearance: "none",
  border: `1px dashed ${theme.palette.base["06"]}`,
  background: "transparent",
  borderRadius: 16,
  padding: "16px 18px",
  minHeight: 92,
  width: "100%",
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: 14,
  cursor: "pointer",
  color: "inherit",
  textAlign: "left",
  "&:hover": {
    borderColor: theme.palette.brand.main,
    background: "rgba(76,111,255,0.08)"
  }
}));

export function FeaturedWorkspace({
  name,
  date,
  ownerLabel,
  onOpen,
  onSettings
}: {
  name: string;
  date: string;
  ownerLabel: string;
  onOpen: () => void;
  onSettings: () => void;
}) {
  return (
    <FeaturedRoot>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <LogoMark size={40} />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "brand.main"
          }}
        >
          Continue
        </Typography>
      </Box>
      <Typography
        sx={{
          fontFamily: "Poppins, sans-serif",
          fontSize: { xs: 28, md: 36 },
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          color: "base.01"
        }}
      >
        {name}
      </Typography>
      <Typography sx={{ mt: 1.5, color: "base.05", fontSize: 14 }}>
        Created by {ownerLabel} · {date}
      </Typography>
      <Box sx={{ mt: "auto", pt: 4, display: "flex", gap: 1.5, width: "100%" }}>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          sx={{
            bgcolor: "brand.main",
            color: "#fff",
            textTransform: "none",
            fontWeight: 600,
            px: 2.5,
            borderRadius: 2,
            "&:hover": { bgcolor: "brand.04" }
          }}
        >
          Open studio
        </Button>
        <Button
          variant="outlined"
          onClick={(event) => {
            event.stopPropagation();
            onSettings();
          }}
          sx={{
            borderColor: "base.07",
            color: "base.03",
            textTransform: "none",
            minWidth: 44,
            borderRadius: 2
          }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </Button>
      </Box>
    </FeaturedRoot>
  );
}

export function CompactWorkspace({
  name,
  date,
  ownerLabel,
  onOpen,
  onSettings
}: {
  name: string;
  date: string;
  ownerLabel: string;
  onOpen: () => void;
  onSettings: () => void;
}) {
  return (
    <CompactRoot type="button" onClick={onOpen}>
      <LogoMark size={28} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 15,
            color: "base.02",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {name}
        </Typography>
        <Typography
          sx={{
            fontSize: 12,
            color: "base.05",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {ownerLabel} · {date}
        </Typography>
      </Box>
      <Box
        component="span"
        onClick={(event) => {
          event.stopPropagation();
          onSettings();
        }}
        sx={{
          color: "base.05",
          display: "flex",
          p: 0.5,
          "&:hover": { color: "brand.main" }
        }}
      >
        <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
      </Box>
    </CompactRoot>
  );
}

export function CreateWorkspaceRow({ onClick }: { onClick: () => void }) {
  return (
    <CreateRoot type="button" onClick={onClick}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          bgcolor: "rgba(76,111,255,0.15)",
          color: "brand.main",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <AddIcon />
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, fontSize: 15, color: "base.02" }}>
          New workspace
        </Typography>
        <Typography sx={{ fontSize: 12, color: "base.05" }}>
          Start a blank Voice Studio project
        </Typography>
      </Box>
    </CreateRoot>
  );
}

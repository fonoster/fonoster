import React from "react";
import {
  WorkspaceCardRoot,
  StyledDescription,
  StyledDateContainer,
  StyledBottomContainer,
  StyledDate,
  StyledIcon,
  StyledOwnerContainer,
  StyledOwnerIcon,
  StyledOwnerText
} from "./workspace-card.styles";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { RegionBadge } from "../region-badge/region-badge";
import { Box, Typography } from "@mui/material";
import { LogoMark } from "../logo/logo-mark";

export interface WorkspaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  region?: string;
  description?: string;
  date?: string;
  owner?: {
    ref: string;
    name: string;
    email: string;
  };
  disabled?: boolean;
  workspaceRef?: React.RefObject<HTMLDivElement>;
  onSettingsClick?: () => void;
}

export const WorkspaceCard: React.FC<WorkspaceCardProps> = ({
  onClick,
  region,
  description,
  date,
  owner,
  disabled = false,
  workspaceRef,
  onSettingsClick
}) => {
  return (
    <WorkspaceCardRoot
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      workspaceVariant="regular"
      ref={workspaceRef}
    >
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          textAlign: "left"
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1
          }}
        >
          <LogoMark size={32} />
          {region && <RegionBadge type="landing-page">{region}</RegionBadge>}
        </Box>
        {description && <StyledDescription>{description}</StyledDescription>}
        {owner && (
          <StyledOwnerContainer>
            <StyledOwnerIcon>
              <PersonOutlinedIcon />
            </StyledOwnerIcon>
            <StyledOwnerText>
              {owner.name || owner.email || "Owner"}
            </StyledOwnerText>
          </StyledOwnerContainer>
        )}
        <StyledBottomContainer>
          <StyledDateContainer>
            <StyledIcon>
              <CalendarTodayOutlinedIcon />
            </StyledIcon>
            {date && <StyledDate>{date}</StyledDate>}
          </StyledDateContainer>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography
              sx={{
                fontSize: "12px",
                fontWeight: 600,
                color: "brand.main",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              Open
              <ArrowForwardIcon sx={{ fontSize: 14 }} />
            </Typography>
            <StyledIcon
              onClick={(event) => {
                event.stopPropagation();
                onSettingsClick?.();
              }}
              clickable={!disabled && !!onSettingsClick}
            >
              <SettingsOutlinedIcon />
            </StyledIcon>
          </Box>
        </StyledBottomContainer>
      </Box>
    </WorkspaceCardRoot>
  );
};

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { User } from "@/types/user";
import { usePopover } from "@/common/hooks/use-popover";
import { NotificationsPopover } from "./notifications";
import { UserPopover } from "./user-popover";
import { Logo } from "@/common/components/logo/Logo";
import { NavButton } from "@stories/navbutton/NavButton";
import { useUser } from "@/common/sdk/hooks/useUser";
import Link from "next/link";

export interface HeaderProps {}

export function Header({
  hamburgerIcon
}: {
  hamburgerIcon?: React.ReactNode;
}): React.JSX.Element {
  const { loggedUser } = useUser();
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const logged = await loggedUser();
      setUser(logged ? (logged as unknown as User) : null);
    };
    fetchUser();
  }, []);

  return (
    <React.Fragment>
      <Box
        component="header"
        sx={{
          "--MainNav-background": "var(--mui-palette-background-default)",
          "--MainNav-divider": "#E0E0E0",
          bgcolor: "var(--MainNav-background)",
          borderBottom: "1px solid #E0E0E0",
          boxShadow: "0.5px 0 2px rgba(0, 0, 0, 0.05)",
          left: 0,
          position: "sticky",
          top: 0,
          height: "var(--MainNav-height, 80px)",
          minHeight: "var(--MainNav-height, 80px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{
            minHeight: 80,
            px: "40px"
          }}
        >
          <Box
            sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center" }}
          >
            <Link href="/workspace" style={{ lineHeight: "0px" }}>
              <Logo size="small" />
            </Link>
          </Box>
          {hamburgerIcon}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              flex: "1 1 auto",
              justifyContent: "flex-end"
            }}
          >
            <NotificationsButton user={user} />
            <UserButton user={user} />
          </Stack>
        </Stack>
      </Box>
    </React.Fragment>
  );
}

function NotificationsButton({
  user
}: {
  user: User | null;
}): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (buttonRef.current) {
      popover.anchorRef.current = buttonRef.current;
    }
  }, [buttonRef.current]);

  return (
    <React.Fragment>
      <Box ref={buttonRef}>
        <NavButton
          variant="notifications"
          isOpen={popover.open}
          label={5}
          onClick={popover.handleOpen}
        />
      </Box>
      <NotificationsPopover
        anchorEl={popover.anchorRef.current}
        onClose={popover.handleClose}
        open={popover.open}
        user={user as User}
      />
    </React.Fragment>
  );
}

export function UserButton({ user }: { user: User | null }): React.JSX.Element {
  const popover = usePopover<HTMLButtonElement>();
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (buttonRef.current) {
      popover.anchorRef.current = buttonRef.current;
    }
  }, [buttonRef.current]);

  return (
    <React.Fragment>
      <Box ref={buttonRef}>
        <NavButton
          variant="profile"
          isOpen={popover.open}
          label={(() => {
            if (!user?.name) return "F";
            const nameParts = user.name.trim().split(/\s+/);
            const firstName = nameParts[0] || "";
            const lastName = nameParts[1] || "";
            const firstInitial = firstName.charAt(0);
            const lastInitial = lastName.charAt(0);
            return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
          })()}
          onClick={popover.handleOpen}
        />
      </Box>
      {user && (
        <UserPopover
          user={user as User}
          anchorEl={popover.anchorRef.current}
          onClose={popover.handleClose}
          open={popover.open}
        />
      )}
    </React.Fragment>
  );
}

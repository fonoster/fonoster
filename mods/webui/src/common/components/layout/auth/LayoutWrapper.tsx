import { useEffect, memo, useState, MouseEvent } from 'react'
import { useRouter } from 'next/router'
import { FullLayout } from '@/pages/workspace/_components/layouts/FullLayout'
import { SimpleLayout } from '@/common/components/layout/auth/SimpleLayout'
import Head from 'next/head'
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Avatar,
    Typography,
    Divider,
    Badge,
    List,
    ListItem,
    ListItemText
} from '@mui/material'
import {
    AccountCircle,
    Notifications as NotificationsIcon
} from '@mui/icons-material'
import { NextAppProvider } from '@toolpad/core/nextjs'
import { fnLight, fnDark } from '../../../../../theme/theme'
import { NAVIGATION } from '@/pages/workspace/_components/layouts/navigation'
import { Logo } from '@/common/components/logo/Logo'
import { ThemeSwitcher } from '@toolpad/core/DashboardLayout'
import { useUser } from '@/common/sdk/hooks/useUser'
import { User } from '@fonoster/types'
import { useFonosterClient } from '@/common/sdk/hooks/useFonosterClient';

const SIMPLE_LAYOUT_ROUTES = [
    '/workspace',
    '/workspace/create',
    '/personal/settings'
]

const BRANDING = {
    title: '',
    logo: <Logo size="small" />
}

export const ToolbarActions = memo(() => {
    const router = useRouter()
    const { loggedUser } = useUser();
    const { authentication } = useFonosterClient();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [notificationAnchorEl, setNotificationAnchorEl] = useState<HTMLElement | null>(null)
    const [user, setUser] = useState<User | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const user = await loggedUser();
            setUser(user || null);
        };
        fetchUser();
    }, [loggedUser])

    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: 'New Message',
            description: 'You have a new message from John',
            time: '5 min ago',
            read: false
        },
        {
            id: 2,
            title: 'System Update',
            description: 'System maintenance scheduled',
            time: '1 hour ago',
            read: false
        }
    ]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleMenuClose = () => {
        setAnchorEl(null)
    }

    const handleLogout = () => {
        handleMenuClose();
        authentication.signOut();
    }

    const handleProfileSettings = () => {
        router.push('/personal/settings')
        handleMenuClose()
    }

    const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
        setNotificationAnchorEl(event.currentTarget);
    };

    const handleNotificationClose = () => {
        setNotificationAnchorEl(null);
    };

    const handleNotificationRead = (notificationId: number) => {
        setNotifications(notifications.map(notification =>
            notification.id === notificationId
                ? { ...notification, read: true }
                : notification
        ));
    };

    return (
        <>
            <ThemeSwitcher />
            <IconButton
                color="inherit"
                onClick={handleNotificationClick}
                sx={{ mx: 1 }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                PaperProps={{
                    sx: {
                        minWidth: 320,
                        maxHeight: 400,
                        overflowY: 'auto'
                    }
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem sx={{ justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1">Notifications</Typography>
                    {unreadCount > 0 && (
                        <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                        >
                            {unreadCount} new
                        </Typography>
                    )}
                </MenuItem>
                <Divider />
                {notifications.length === 0 ? (
                    <MenuItem>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No notifications
                        </Typography>
                    </MenuItem>
                ) : (
                    <List sx={{ p: 0 }}>
                        {notifications.map((notification) => (
                            <ListItem
                                key={notification.id}
                                onClick={() => handleNotificationRead(notification.id)}
                                sx={{
                                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={notification.title}
                                    secondary={
                                        <>
                                            <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.primary"
                                                sx={{ display: 'block' }}
                                            >
                                                {notification.description}
                                            </Typography>
                                            <Typography
                                                component="span"
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                {notification.time}
                                            </Typography>
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
                <Divider />
                <MenuItem onClick={handleNotificationClose}>
                    <Typography variant="body2" sx={{ width: '100%', textAlign: 'center' }}>
                        View all notifications
                    </Typography>
                </MenuItem>
            </Menu>

            <IconButton
                onClick={handleMenuOpen}
                color="inherit"
                sx={{ p: 0.5 }}
            >
                {user?.avatar ? (
                    <Avatar src={user.avatar} alt={user.name} sx={{ width: 32, height: 32 }} />
                ) : (
                    <AccountCircle sx={{ width: 32, height: 32 }} />
                )}
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: { minWidth: 200 }
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem sx={{ pointerEvents: 'none' }}>
                    <div>
                        <Typography variant="subtitle1">{user?.name}</Typography>
                        <Typography variant="body2" color="textSecondary">
                            {user?.email}
                        </Typography>
                    </div>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleProfileSettings}>Personal Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
        </>
    )
})

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const useSimpleLayout = SIMPLE_LAYOUT_ROUTES.includes(router.pathname)

    return (
        <NextAppProvider
            navigation={NAVIGATION}
            branding={BRANDING}
            theme={{
                light: fnLight,
                dark: fnDark
            }}
        >
            <Head>
                <meta name="viewport" content="initial-scale=1, width=device-width" />
                <meta charSet="utf-8" />
                <meta name="description" content="Fonoster Workspace" />
                <title>Fonoster</title>
            </Head>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                {useSimpleLayout ? (
                    <SimpleLayout>{children}</SimpleLayout>
                ) : (
                    <FullLayout>{children}</FullLayout>
                )}
            </Box>
        </NextAppProvider>
    )
} 
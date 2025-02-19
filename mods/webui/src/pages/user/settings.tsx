import { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    useTheme,
    Stack,
    Switch,
    FormControlLabel,
    Avatar,
    IconButton
} from '@mui/material';
import { PhotoCamera, Lock, Mail, Person } from '@mui/icons-material';
import { useForm, FormProvider } from 'react-hook-form';
import { InputContext } from '@/common/hooksForm/InputContext';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUser } from '@/common/sdk/hooks/useUser';
import PageContainer from '@/common/components/page-with-table';
import { useRouter } from 'next/router';

const { ContentForm, Header } = PageContainer;

type SettingsFormData = {
    ref: string;
    name: string;
    email: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    avatar?: string;
};

const settingsSchema = z.object({
    ref: z.string().optional(),
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    currentPassword: z.string().optional(),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number')
        .regex(/[^A-Za-z0-9]/, 'Password must contain at least one symbol')
        .optional(),
    confirmPassword: z.string().optional(),
    avatar: z.string().optional(),
}).refine((data) => {
    if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});


const SettingsPage = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [lightMode, setLightMode] = useState(true);
    const [avatar, setAvatar] = useState('');
    const { getUser, updateUser, loginUser } = useUser();
    const router = useRouter();
    const { workspaceId } = router.query;

    const methods = useForm<SettingsFormData>({
        resolver: zodResolver<SettingsFormData>(settingsSchema),
        defaultValues: {
            ref: '',
            name: '',
            email: '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            avatar: ''
        }
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await loginUser();
                console.log(user);
                // const response = await getUser();
                // const { items } = response;
                // const formattedWorkspaces = items.map(workspace => ({
                //   ref: workspace.ref,
                //   region: workspace.region || process.env.NEXT_PUBLIC_FONOSTER_REGION,
                //   description: workspace.name || 'No description',
                //   date: new Date(workspace.createdAt).toLocaleDateString(),
                // }));

                // if (mounted) {
                //   setWorkspaces(formattedWorkspaces);
                // }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [methods]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log('Avatar file:', e.target.files);
        }
    };

    const onSubmit = async (data: SettingsFormData) => {

        try {
            await updateUser({ ...data });
            alert('Settings updated successfully');
        } catch (error) {
            alert('An error occurred while updating settings');
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <PageContainer>
            <Header title="Personal Settings"
                actions={<Button type="submit" variant="contained" size="large">SAVE CHANGES</Button>}
                backTo={{
                    label: 'Back to Overview',
                    onClick: () => router.push(`/workspace/${workspaceId}/overview`)
                }}
            />


            <ContentForm methods={methods} formId="user-settings-form">
                <InputContext
                    id="user-settings-name"
                    name="name"
                    label="Name"
                    leadingIcon={<Person />}
                />

                <InputContext
                    id="user-settings-email"
                    name="email"
                    label="Email Address"
                    type="email"
                    leadingIcon={<Mail />}
                />

                <Typography variant="body1" sx={{ mt: 2 }}>
                    Change Password
                </Typography>

                <InputContext
                    id="user-settings-current-password"
                    name="currentPassword"
                    label="Current Password"
                    type="password"
                    leadingIcon={<Lock />}
                />

                <InputContext
                    id="user-settings-new-password"
                    name="newPassword"
                    label="New Password"
                    type="password"
                    leadingIcon={<Lock />}
                />

                <InputContext
                    id="user-settings-confirm-password"
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    leadingIcon={<Lock />}
                />

                <Box sx={{
                    display: 'flex',
                    mb: 4
                }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={avatar || '/default-avatar.png'}
                            alt="User Avatar"
                            sx={{ width: 100, height: 100 }}
                        />
                        <IconButton
                            color="primary"
                            aria-label="upload picture"
                            component="label"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                backgroundColor: theme.palette.background.paper,
                                '&:hover': { backgroundColor: theme.palette.background.paper },
                            }}
                        >
                            <input
                                hidden
                                accept="image/*"
                                type="file"
                                onChange={handleAvatarChange}
                            />
                            <PhotoCamera />
                        </IconButton>
                    </Box>
                </Box>

                <Typography variant="body1" sx={{ mt: 2 }}>
                    Display Settings
                </Typography>

                <FormControlLabel
                    control={
                        <Switch
                            checked={lightMode}
                            onChange={(e) => setLightMode(e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Light Mode"
                />
            </ContentForm>
        </PageContainer>
    );
};

export default SettingsPage;

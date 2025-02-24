import * as React from 'react'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { ToolbarActions } from '@/common/components/layout/auth/LayoutWrapper'
import { DynamicLayout } from '@/common/components/layout/nav/dynamic-layout'

export function FullLayout({ children }: { children: React.ReactNode }) {
    return (
        <DynamicLayout>
            <PageContainer
                maxWidth={false}
                disableGutters
                sx={{
                    width: '85%',
                    '& .MuiContainer-root': {
                        maxWidth: 'none',
                        padding: 0,
                        margin: 0
                    },

                }}
            >
                {children}
            </PageContainer>
        </DynamicLayout>
    )
}
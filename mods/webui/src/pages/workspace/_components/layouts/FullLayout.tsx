import * as React from 'react'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { ToolbarActions } from './LayoutWrapper'

export function FullLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout slots={{
            toolbarActions: ToolbarActions
        }}>
            <PageContainer
                maxWidth={false}
                disableGutters
                sx={{
                    width: '85%',
                    '& .MuiContainer-root': {
                        maxWidth: 'none',
                        padding: 0,
                        margin: 0
                    }
                }}
            >
                {children}
            </PageContainer>
        </DashboardLayout>
    )
}
import * as React from 'react'
import { PageContainer } from '@toolpad/core/PageContainer'
import { DashboardLayout } from '@toolpad/core/DashboardLayout'
import { ToolbarActions } from '@/common/components/layout/auth/LayoutWrapper'

export function FullLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout
            slots={{
                toolbarActions: ToolbarActions
            }}
            sx={{
                '& nav > ul > li:first-of-type': {
                    '& .Mui-selected': {
                        backgroundColor: 'inherit'
                    },
                    '& .Mui-focusVisible': {
                        backgroundColor: 'inherit'
                    },
                    overflowX: 'unset',
                    margin: '10px',
                    paddingBottom: '15px',
                    '& a': {
                        backgroundColor: 'inherit'
                    },
                    '& a:hover': {
                        backgroundColor: 'inherit'
                    }
                }
            }}
        >
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
        </DashboardLayout>
    )
}
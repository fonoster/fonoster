import * as React from 'react'
import { PageContainer } from '@toolpad/core/PageContainer'
import { SecuredLayout } from '@/common/components/layout/nav'

export function FullLayout({ children }: { children: React.ReactNode }) {
    return (
        <SecuredLayout>
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
        </SecuredLayout>
    )
}
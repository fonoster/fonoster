import * as React from 'react'
import { PageContainer } from '@toolpad/core/PageContainer'
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
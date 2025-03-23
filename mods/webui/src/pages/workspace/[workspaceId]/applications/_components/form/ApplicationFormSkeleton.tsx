import React from "react";
import { Box, Skeleton } from "@mui/material";
import PageContainer from "@/common/components/layout/pages";

const DESCRIPTION_MAX_WIDTH = "510px";
const DESCRIPTION_STYLES = { mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH };

const FormFieldSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Skeleton variant="rounded" height={42} width="40%" />
  </Box>
);

const SectionHeaderSkeleton = () => (
  <Box sx={{ mb: 2, mt: 3 }}>
    <Skeleton variant="text" width={150} height={24} />
  </Box>
);

const DescriptionSkeleton = () => (
  <Box sx={DESCRIPTION_STYLES}>
    <Skeleton variant="text" width="100%" height={20} />
    <Skeleton variant="text" width="80%" height={20} />
  </Box>
);

export default function ApplicationFormSkeleton() {
  return (
    <PageContainer>
      <PageContainer.Header
        title={<Skeleton variant="text" width={250} height={32} />}
        backTo={{
          label: <Skeleton variant="text" width={180} height={24} />,
          onClick: () => {}
        }}
        actions={
          <Box sx={{ display: "flex", gap: 2 }}>
            <Skeleton variant="rounded" width={120} height={40} />
            <Skeleton variant="rounded" width={200} height={40} />
          </Box>
        }
      />

      <Box sx={{ mb: 4, mt: -2, maxWidth: DESCRIPTION_MAX_WIDTH }}>
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
      </Box>

      <Box>
        {/* GENERAL Section */}
        <SectionHeaderSkeleton />
        <FormFieldSkeleton /> {/* Name */}
        <FormFieldSkeleton /> {/* Type */}
        <FormFieldSkeleton /> {/* Endpoint */}
        {/* TEXT TO SPEECH Section */}
        <SectionHeaderSkeleton />
        <DescriptionSkeleton />
        <FormFieldSkeleton /> {/* Vendor */}
        <FormFieldSkeleton /> {/* Voice */}
        {/* SPEECH TO TEXT Section */}
        <SectionHeaderSkeleton />
        <DescriptionSkeleton />
        <FormFieldSkeleton /> {/* Vendor */}
        <FormFieldSkeleton /> {/* Model */}
        <FormFieldSkeleton /> {/* Language */}
      </Box>
    </PageContainer>
  );
}

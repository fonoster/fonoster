import React from 'react';
import { Box, LinearProgress } from '@mui/material';
import { Typography } from '~/core/components/design-system/ui/typography/typography';

type StepProgressProps = {
  steps: string[];
  activeStep: number;
};

const StepProgress: React.FC<StepProgressProps> = ({ steps, activeStep }) => {
  const progress = ((activeStep + 1) / steps.length) * 100;

  return (
    <Box width="100%" px={2}>
      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 5,
          borderRadius: 0,
          backgroundColor: '#E0F2F1',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#1DE9B6',
          },
        }}
      />

      {/* Step Labels */}
      <Box display="flex" justifyContent="space-between" mt={2}>
        {steps.map((label, index) => (
          <Typography
            key={index}
            variant="body-small"
            color={activeStep === index ? 'base.01' : 'base.04'}
          >
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default StepProgress;

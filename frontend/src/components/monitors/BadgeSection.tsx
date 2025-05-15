import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { getBadgeUrl } from '../../services/api';

interface BadgeSectionProps {
  monitorId: number;
  badgeLabel: string;
}

/**
 * Badge section for monitor display
 * Shows markdown code for embedding badge and a live preview
 */
export const BadgeSection: React.FC<BadgeSectionProps> = ({ monitorId, badgeLabel }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" gutterBottom>
        Badge
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" gutterBottom>
          Use this badge in your README or website to show the current status of this monitor:
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', overflowX: 'auto' }}>
            {`![${badgeLabel} Status](http://localhost:8000/badge/${monitorId})`}
          </Typography>
        </Box>
        
        <Box sx={{ mt: 2, p: 1, display: 'flex', justifyContent: 'center' }}>
          <img 
            src={`http://localhost:8000/badge/${monitorId}`} 
            alt={`${badgeLabel} Status`}
          />
        </Box>
      </Paper>
    </Box>
  );
}; 
import React from 'react';
import { Box, Typography, Chip, Button, Card, CardContent } from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  QueryStats as QueryStatsIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { Monitor } from '../../types';

interface MonitorHeaderProps {
  monitor: Monitor;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

/**
 * Header component for monitor details
 * Shows monitor information and action buttons
 */
export const MonitorHeader: React.FC<MonitorHeaderProps> = ({
  monitor,
  onEdit,
  onDelete,
  onBack
}) => {
  
  const getStatusText = (status?: boolean): string => {
    if (status === undefined) return 'UNKNOWN';
    return status ? 'UP' : 'DOWN';
  };
  
  const getMonitorTypeDetails = () => {
    if (monitor.type === 'ping') {
      return (
        <Typography variant="body2" color="text.secondary">
          Host: {monitor.host} 
          {monitor.port && ` : ${monitor.port}`}
        </Typography>
      );
    } else if (monitor.type === 'website') {
      return (
        <Typography variant="body2" color="text.secondary">
          URL: {monitor.url}
        </Typography>
      );
    }
    
    return null;
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={onBack}
        >
          Back to Project
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<QueryStatsIcon />}
            onClick={() => window.open(`/monitors/${monitor.id}/statistics`, '_blank')}
            sx={{ mr: 1 }}
          >
            View Statistics
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={onEdit}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={onDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start'
          }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {monitor.label}
              </Typography>
              <Chip 
                label={monitor.type.toUpperCase()} 
                color={monitor.type === 'ping' ? 'info' : 'secondary'} 
                sx={{ mb: 1 }}
              />
              {getMonitorTypeDetails()}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check interval: {monitor.periodicity} seconds
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Badge label: {monitor.badgeLabel}
              </Typography>
            </Box>
            <Box>
              <Chip 
                label={getStatusText(monitor.latestStatus?.status)} 
                color={monitor.latestStatus?.status ? 'success' : 'error'} 
                sx={{ fontWeight: 'bold', fontSize: '1.1rem', px: 2, py: 2.5 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}; 
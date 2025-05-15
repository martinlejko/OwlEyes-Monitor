import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Chip,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Grid,
  Stack,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { getProject, getMonitors } from '../services/api';
import { Project, Monitor } from '../types';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Add cache-busting timestamp to prevent stale data
        const timestamp = new Date().getTime();
        console.log('Fetching project data with cache buster:', timestamp);
        
        // Fetch project details
        const projectData = await getProject(parseInt(id));
        setProject(projectData);
        
        // Fetch monitors for this project with cache control
        const monitorsResponse = await getMonitors(1, 100, parseInt(id));
        console.log(`Loaded ${monitorsResponse.data.length} monitors for project ${id}`);
        setMonitors(monitorsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching project details:', err);
        setError('Failed to load project details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, location.search]); // Also refresh when search params change (like ?_=timestamp)

  const getStatusColor = (status?: boolean): string => {
    if (status === undefined) return '#9e9e9e'; // Gray for unknown
    return status ? '#4caf50' : '#f44336'; // Green for up, red for down
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading project details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/projects')} 
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  if (!project) {
    return (
      <Box>
        <Alert severity="warning">Project not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/projects')} 
          sx={{ mt: 2 }}
        >
          Back to Projects
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/projects')}
        >
          Back to Projects
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate(`/monitors/new?projectId=${id}`)}
        >
          Add Monitor
        </Button>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {project.label}
          </Typography>
          
          {project.description && (
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
          )}
          
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            {project.tags.map((tag, index) => (
              <Chip key={index} label={tag} color="primary" variant="outlined" />
            ))}
          </Stack>
        </CardContent>
      </Card>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Monitors
        </Typography>
        
        {monitors.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No monitors found for this project.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate('/monitors/new')}
            >
              Add your first monitor
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {monitors.map((monitor) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={monitor.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    borderLeft: `4px solid ${getStatusColor(monitor.latestStatus?.status)}`
                  }}
                  onClick={() => navigate(`/monitors/${monitor.id}`)}
                >
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {monitor.label}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label={monitor.type.toUpperCase()} 
                        size="small" 
                        color={monitor.type === 'ping' ? 'info' : 'secondary'} 
                      />
                      <Chip 
                        label={monitor.latestStatus?.status ? 'UP' : 'DOWN'} 
                        size="small" 
                        color={monitor.latestStatus?.status ? 'success' : 'error'} 
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    {monitor.latestStatus && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Response time: {monitor.latestStatus.responseTime}ms
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ProjectDetail; 
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  LinearProgress,
  Paper,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getProjects, getMonitors } from '../services/api';
import { Project, Monitor } from '../types';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentMonitors, setRecentMonitors] = useState<Monitor[]>([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalMonitors: 0,
    upMonitors: 0,
    downMonitors: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch projects
        const projectsResponse = await getProjects(1, 5);
        setProjects(projectsResponse.data);
        setStats(prev => ({ ...prev, totalProjects: projectsResponse.meta.total }));
        
        // Fetch monitors
        const monitorsResponse = await getMonitors(1, 10);
        setRecentMonitors(monitorsResponse.data);
        
        // Calculate stats
        const totalMonitors = monitorsResponse.meta.total;
        let upCount = 0;
        let downCount = 0;
        
        monitorsResponse.data.forEach(monitor => {
          if (monitor.latestStatus?.status) {
            upCount++;
          } else if (monitor.latestStatus) {
            downCount++;
          }
        });
        
        setStats({
          totalProjects: projectsResponse.meta.total,
          totalMonitors,
          upMonitors: upCount,
          downMonitors: downCount
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const getStatusColor = (status?: boolean): string => {
    if (status === undefined) return '#9e9e9e'; // Gray for unknown
    return status ? '#4caf50' : '#f44336'; // Green for up, red for down
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Stats overview */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Total Projects
                    </Typography>
                    <Typography variant="h3">
                      {stats.totalProjects}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 22%' } }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Total Monitors
                    </Typography>
                    <Typography variant="h3">
                      {stats.totalMonitors}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 22%' } }}>
                <Card sx={{ bgcolor: 'success.light' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Up Monitors
                    </Typography>
                    <Typography variant="h3">
                      {stats.upMonitors}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box sx={{ flex: { xs: '1 0 100%', sm: '1 0 45%', md: '1 0 22%' } }}>
                <Card sx={{ bgcolor: 'error.light' }}>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Down Monitors
                    </Typography>
                    <Typography variant="h3">
                      {stats.downMonitors}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
          
          {/* Recent projects */}
          <Typography variant="h5" gutterBottom>
            Recent Projects
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {projects.length > 0 ? (
                projects.map(project => (
                  <Paper 
                    key={project.id}
                    elevation={1} 
                    sx={{ 
                      p: 2, 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <Typography variant="h6" gutterBottom>
                      {project.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {project.description || 'No description'}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {project.tags.map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                        />
                      ))}
                    </Stack>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1" color="text.secondary" align="center">
                  No projects found. Create your first project!
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Recent monitors status */}
          <Typography variant="h5" gutterBottom>
            Monitor Status
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {recentMonitors.length > 0 ? (
              recentMonitors.map(monitor => (
                <Box key={monitor.id} sx={{ flex: { xs: '1 0 100%', sm: '1 0 48%', md: '1 0 31%' } }}>
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
                </Box>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" align="center" sx={{ width: '100%' }}>
                No monitors found. Create your first monitor!
              </Typography>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 
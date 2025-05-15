import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon
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
  
  // Filter states
  const [labelFilter, setLabelFilter] = useState('');
  const [debouncedLabelFilter, setDebouncedLabelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ping' | 'website'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down'>('all');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  // Add a ref for the search input to maintain focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce the label filter to avoid jittery UI
  useEffect(() => {
    setIsFiltering(true);
    const timerId = setTimeout(() => {
      setDebouncedLabelFilter(labelFilter);
      setIsFiltering(false);
    }, 300); // 300ms debounce time

    return () => {
      clearTimeout(timerId);
    };
  }, [labelFilter]);

  // Maintain focus when filter results change
  useEffect(() => {
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [monitors, error]);

  const fetchData = useCallback(async () => {
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
      
      // Fetch monitors for this project with filters
      let statusBool: boolean | undefined = undefined;
      if (statusFilter === 'up') statusBool = true;
      if (statusFilter === 'down') statusBool = false;
      
      const typeValue = typeFilter === 'all' ? undefined : typeFilter;
      
      const monitorsResponse = await getMonitors(
        1, 
        100, 
        parseInt(id),
        debouncedLabelFilter || undefined,
        typeValue,
        statusBool
      );
      
      console.log(`Loaded ${monitorsResponse.data.length} monitors for project ${id}`);
      setMonitors(monitorsResponse.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError('Failed to load project details. Please try again later.');
      setLoading(false);
    }
  }, [id, location.search, debouncedLabelFilter, typeFilter, statusFilter]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status?: boolean): string => {
    if (status === undefined) return '#9e9e9e'; // Gray for unknown
    return status ? '#4caf50' : '#f44336'; // Green for up, red for down
  };

  const handleLabelFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setLabelFilter(event.target.value);
  };

  const handleTypeFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setTypeFilter(event.target.value as 'all' | 'ping' | 'website');
  };

  const handleStatusFilterChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatusFilter(event.target.value as 'all' | 'up' | 'down');
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const clearFilters = () => {
    setLabelFilter('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  if (loading && monitors.length === 0) {
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Monitors
          </Typography>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={toggleFilters}
          >
            {filtersVisible ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </Box>
        
        {filtersVisible && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }}>
            <Typography variant="subtitle1" gutterBottom>
              Filter Options
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 3' } }}>
                <TextField
                  fullWidth
                  label="Filter by Label"
                  variant="outlined"
                  size="small"
                  value={labelFilter}
                  onChange={handleLabelFilterChange}
                  inputRef={searchInputRef}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  InputProps={{
                    endAdornment: isFiltering ? (
                      <CircularProgress size={20} thickness={5} sx={{ color: 'primary.light' }} />
                    ) : null
                  }}
                />
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 3' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Monitor Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Monitor Type"
                    onChange={handleTypeFilterChange}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="ping">Ping</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 3' } }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={handleStatusFilterChange}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="up">Up</MenuItem>
                    <MenuItem value="down">Down</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 3' } }}>
                <Button
                  variant="outlined"
                  onClick={clearFilters}
                  size="small"
                  fullWidth
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}
        
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        
        {monitors.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              {filtersVisible ? 'No monitors match your filters.' : 'No monitors found for this project.'}
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              sx={{ mt: 2 }}
              onClick={() => navigate(`/monitors/new?projectId=${id}`)}
            >
              Add your first monitor
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {monitors.map((monitor) => (
              <Grid item xs={12} sm={6} md={4} key={monitor.id}>
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
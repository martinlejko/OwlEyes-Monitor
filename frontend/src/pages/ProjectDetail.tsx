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
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { getProject, getMonitors, deleteProject, updateProject, deleteMonitor } from '../services/api';
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
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<{
    label: string;
    description: string;
    tags: string[];
  }>({
    label: '',
    description: '',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [editFormErrors, setEditFormErrors] = useState({
    label: '',
    description: ''
  });
  
  // Monitor delete states
  const [monitorDeleteDialogOpen, setMonitorDeleteDialogOpen] = useState(false);
  const [monitorToDelete, setMonitorToDelete] = useState<Monitor | null>(null);
  const [isDeletingMonitor, setIsDeletingMonitor] = useState(false);
  const [monitorDeleteError, setMonitorDeleteError] = useState<string | null>(null);
  
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

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      
      if (id) {
        console.log('Confirming deletion of project ID:', id);
        
        // Add cache-busting timestamp for navigation
        const timestamp = new Date().getTime();
        
        await deleteProject(parseInt(id));
        console.log('Delete operation completed successfully');
        
        setDeleteDialogOpen(false);
        
        // Navigate back to projects list with cache buster
        navigate(`/projects?_=${timestamp}`);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setDeleteError('Failed to delete the project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = () => {
    if (project) {
      setEditFormData({
        label: project.label,
        description: project.description,
        tags: [...project.tags]
      });
      setEditError(null);
      setEditFormErrors({
        label: '',
        description: ''
      });
      setEditDialogOpen(true);
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
    
    // Clear error when user types
    if (editFormErrors[name as keyof typeof editFormErrors]) {
      setEditFormErrors({
        ...editFormErrors,
        [name]: ''
      });
    }
  };
  
  const handleAddTag = () => {
    if (newTag.trim() && !editFormData.tags.includes(newTag.trim())) {
      setEditFormData({
        ...editFormData,
        tags: [...editFormData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditFormData({
      ...editFormData,
      tags: editFormData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateEditForm = (): boolean => {
    const errors = {
      label: '',
      description: ''
    };
    
    let isValid = true;
    
    if (!editFormData.label.trim()) {
      errors.label = 'Project name is required';
      isValid = false;
    }
    
    if (editFormData.label.length > 100) {
      errors.label = 'Project name must be less than 100 characters';
      isValid = false;
    }
    
    if (editFormData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
      isValid = false;
    }
    
    setEditFormErrors(errors);
    return isValid;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm() || !id) {
      return;
    }
    
    setIsSaving(true);
    setEditError(null);
    
    try {
      await updateProject(parseInt(id), {
        label: editFormData.label.trim(),
        description: editFormData.description.trim(),
        tags: editFormData.tags
      });
      
      setEditDialogOpen(false);
      
      // Refresh the data
      fetchData();
    } catch (err) {
      console.error('Error updating project:', err);
      setEditError('Failed to update project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle monitor deletion
  const handleMonitorDeleteClick = (event: React.MouseEvent, monitor: Monitor) => {
    event.stopPropagation(); // Prevent navigating to monitor details
    setMonitorToDelete(monitor);
    setMonitorDeleteError(null);
    setMonitorDeleteDialogOpen(true);
  };

  const handleMonitorDeleteCancel = () => {
    setMonitorDeleteDialogOpen(false);
    setMonitorToDelete(null);
  };

  const handleMonitorDeleteConfirm = async () => {
    if (!monitorToDelete) return;
    
    try {
      setIsDeletingMonitor(true);
      setMonitorDeleteError(null);
      
      await deleteMonitor(monitorToDelete.id);
      
      // Successfully deleted, refresh the monitors list
      fetchData();
      
      setMonitorDeleteDialogOpen(false);
      setMonitorToDelete(null);
    } catch (err) {
      console.error('Error deleting monitor:', err);
      setMonitorDeleteError('Failed to delete the monitor. Please try again.');
    } finally {
      setIsDeletingMonitor(false);
    }
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
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            sx={{ mr: 1 }}
          >
            Edit Project
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
            sx={{ mr: 1 }}
          >
            Delete Project
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
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ mb: 0 }}>
                        {monitor.label}
                      </Typography>
                      <Tooltip title="Delete Monitor">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleMonitorDeleteClick(e, monitor)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-description"
      >
        <DialogTitle id="delete-project-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-project-dialog-description">
            Are you sure you want to delete the project "{project.label}"? This action cannot be undone and will also delete all associated monitors.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Edit Project Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        aria-labelledby="edit-project-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="edit-project-dialog-title">
          Edit Project
        </DialogTitle>
        <DialogContent>
          {editError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {editError}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            id="label"
            name="label"
            label="Project Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.label}
            onChange={handleInputChange}
            error={!!editFormErrors.label}
            helperText={editFormErrors.label}
            sx={{ mb: 2 }}
            required
          />
          
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.description}
            onChange={handleInputChange}
            error={!!editFormErrors.description}
            helperText={editFormErrors.description}
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {editFormData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Add Tag"
                variant="outlined"
                size="small"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTag}
                disabled={!newTag.trim()}
              >
                Add
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            color="primary" 
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Monitor Delete Confirmation Dialog */}
      <Dialog
        open={monitorDeleteDialogOpen}
        onClose={handleMonitorDeleteCancel}
        aria-labelledby="delete-monitor-dialog-title"
        aria-describedby="delete-monitor-dialog-description"
      >
        <DialogTitle id="delete-monitor-dialog-title">
          Delete Monitor
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-monitor-dialog-description">
            Are you sure you want to delete the monitor "{monitorToDelete?.label}"? This action cannot be undone and will also delete all associated status history.
          </DialogContentText>
          {monitorDeleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {monitorDeleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleMonitorDeleteCancel} disabled={isDeletingMonitor}>
            Cancel
          </Button>
          <Button 
            onClick={handleMonitorDeleteConfirm} 
            color="error" 
            disabled={isDeletingMonitor}
            startIcon={isDeletingMonitor ? <CircularProgress size={20} /> : <DeleteIcon />}
          >
            {isDeletingMonitor ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetail; 
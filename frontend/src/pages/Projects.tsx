import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid as MuiGrid,
  LinearProgress,
  Alert,
  TablePagination,
  Container,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Switch,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import {
  Add as AddIcon,
  FolderOpen as FolderIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  SortByAlpha as SortIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { getProjects, deleteProject, FilterParams } from '../services/api';
import { Project } from '../types';

const Grid = MuiGrid as any; // Temporary type assertion to fix the issue

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);

  // Filter and sort states
  const [labelFilter, setLabelFilter] = useState('');
  const [debouncedLabelFilter, setDebouncedLabelFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add a ref for the search input to maintain focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add a state to track if filtering is in progress
  const [isFiltering, setIsFiltering] = useState(false);

  // Maintain focus when filter results change
  useEffect(() => {
    // Keep focus in the input field when results change
    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [projects, error]);

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

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Updated API call with filter and sort parameters
      const filterParams: FilterParams = {
        labelFilter: debouncedLabelFilter,
        tags: selectedTags,
        sortBy: 'label',
        sortDirection,
      };

      const response = await getProjects(page + 1, rowsPerPage, filterParams);
      setProjects(response.data);
      setTotalProjects(response.meta.total);

      // Extract all unique tags from projects for the filter dropdown
      if (response.data.length > 0 && availableTags.length === 0) {
        const allTags = response.data
          .flatMap((project) => project.tags || [])
          .filter((tag, index, self) => tag && self.indexOf(tag) === index);
        setAvailableTags(allTags);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, debouncedLabelFilter, selectedTags, sortDirection, availableTags.length]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewProject = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const handleLabelFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default behavior that might cause page refreshes
    event.preventDefault();
    setLabelFilter(event.target.value);
  };

  // Reset page when debounced filter changes
  useEffect(() => {
    setPage(0);
  }, [debouncedLabelFilter]);

  const handleTagsChange = (_event: React.SyntheticEvent, value: string[]) => {
    setSelectedTags(value);
    setPage(0); // Reset to first page when changing filters
  };

  const handleSortDirectionChange = () => {
    setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
    setPage(0);
  };

  const toggleFilters = () => {
    setFiltersVisible(!filtersVisible);
  };

  const clearFilters = () => {
    setLabelFilter('');
    setSelectedTags([]);
    setSortDirection('asc');
    setPage(0);
  };

  // Handle delete project
  const handleDeleteClick = (event: React.MouseEvent, project: Project) => {
    event.stopPropagation(); // Prevent navigating to project details
    setProjectToDelete(project);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    try {
      setIsDeleting(true);
      setDeleteError(null);

      await deleteProject(projectToDelete.id);

      // Successfully deleted, refresh the list
      fetchProjects();

      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error('Error deleting project:', err);
      setDeleteError('Failed to delete the project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading && projects.length === 0) {
    // Show main loading only on initial load
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading projects...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        component="form"
        onSubmit={(e) => e.preventDefault()}
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            <FolderIcon sx={{ mr: 1.5, fontSize: '2rem' }} color="primary" /> Projects
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={toggleFilters}
              sx={{ mr: 1 }}
            >
              {filtersVisible ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/projects/new')}
            >
              Create Project
            </Button>
          </Stack>
        </Stack>

        {filtersVisible && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.12)',
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Filter and Sort Options
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <TextField
                  fullWidth
                  label="Filter by Label"
                  variant="outlined"
                  size="small"
                  value={labelFilter}
                  onChange={handleLabelFilterChange}
                  inputRef={searchInputRef}
                  // Prevent lost focus and prevent form submission
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                    }
                  }}
                  InputProps={{
                    endAdornment: isFiltering ? (
                      <CircularProgress size={20} thickness={5} sx={{ color: 'primary.light' }} />
                    ) : null,
                  }}
                />
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 4' } }}>
                <Autocomplete
                  multiple
                  options={availableTags}
                  value={selectedTags}
                  onChange={handleTagsChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Tags"
                      size="small"
                      placeholder="Select tags"
                    />
                  )}
                  size="small"
                />
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 2' } }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sortDirection === 'desc'}
                        onChange={handleSortDirectionChange}
                      />
                    }
                    label={sortDirection === 'asc' ? 'Sort A-Z' : 'Sort Z-A'}
                  />
                </FormGroup>
              </Grid>
              <Grid item sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 2' } }}>
                <Button variant="outlined" onClick={clearFilters} size="small" fullWidth>
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {projects.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No projects found. Adjust your filters or create a new project.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid
                  item
                  sx={{ width: '100%', gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4' } }}
                  key={project.id.toString()}
                >
                  <Card
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                        transform: 'translateY(-2px)',
                      },
                      borderRadius: '8px',
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h2"
                          gutterBottom
                          sx={{ fontWeight: 'medium', mb: 0 }}
                        >
                          {project.label}
                        </Typography>
                        <Tooltip title="Delete Project">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => handleDeleteClick(e, project)}
                            sx={{ ml: 1 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1.5,
                          minHeight: '60px', // Adjust for 3 lines approx
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {project.description || 'No description available.'}
                      </Typography>
                      {project.tags && project.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 1 }}>
                          {project.tags.slice(0, 3).map((tag, index) => (
                            <Chip
                              label={tag}
                              key={`${project.id}-tag-${index}`}
                              size="small"
                              variant="outlined"
                              color="primary"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                          {project.tags.length > 3 && (
                            <Chip
                              label={`+${project.tags.length - 3} more`}
                              size="small"
                              variant="outlined"
                              color="default"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 1.5, px: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewProject(project.id)}
                        sx={{ textTransform: 'none', fontWeight: 'medium' }}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <TablePagination
              component="div"
              count={totalProjects}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 15, 25, 50]}
              sx={{
                mt: 4,
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                pt: 2,
                '& .MuiTablePagination-toolbar': {
                  justifyContent: 'center',
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  margin: 0,
                },
              }}
              labelRowsPerPage="Projects per page:"
            />
          </Box>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-project-dialog-title"
        aria-describedby="delete-project-dialog-description"
      >
        <DialogTitle id="delete-project-dialog-title">Delete Project</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-project-dialog-description">
            Are you sure you want to delete the project "{projectToDelete?.label}"? This action
            cannot be undone and will also delete all associated monitors.
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
    </Container>
  );
};

export default ProjectsPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  LinearProgress,
  Alert,
  TablePagination,
  Container,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Add as AddIcon, FolderOpen as FolderIcon, Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';
import { getProjects } from '../services/api';
import { Project } from '../types';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(0); // 0-indexed for MUI TablePagination
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalProjects, setTotalProjects] = useState(0);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjects(page + 1, rowsPerPage);
      setProjects(response.data);
      setTotalProjects(response.meta.total);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

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
  
  // TODO: Add navigation for editing a project if an edit page exists
  // const handleEditProject = (projectId: number) => {
  // navigate(`/projects/${projectId}/edit`); 
  // };

  if (loading && projects.length === 0) { // Show main loading only on initial load
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }}/>
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
      <Paper sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <FolderIcon sx={{ mr: 1.5, fontSize: '2rem' }} color="primary" /> Projects
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects/new')} // Placeholder for new project route
          >
            Create Project
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {projects.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No projects found. Get started by creating a new project.
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3}>
              {projects.map((project) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={project.id.toString()}>
                  <Card sx={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': { 
                      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                      transform: 'translateY(-2px)'
                    },
                    borderRadius: '8px'
                  }}>
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'medium' }}>
                        {project.label}
                      </Typography>
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
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {project.description || 'No description available.'}
                      </Typography>
                      {project.tags && project.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb:1 }}>
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
                      {/* <Tooltip title="Edit Project">
                        <IconButton 
                          onClick={() => handleEditProject(project.id)} 
                          size="small"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon fontSize="small"/>
                        </IconButton>
                      </Tooltip> */}
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
                  justifyContent: 'center'
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  margin: 0
                }
              }}
              labelRowsPerPage="Projects per page:"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProjectsPage; 
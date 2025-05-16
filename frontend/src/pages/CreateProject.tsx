import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Container,
  Paper,
  Grid as MuiGrid,
  LinearProgress,
  Alert,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import {
  FolderOpen as FolderIcon,
  Add as AddIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { createProject } from '../services/api';

const Grid = MuiGrid as any; // Temporary type assertion to fix the issue

const CreateProject: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    description: '',
    tags: [] as string[],
  });

  // New tag input state
  const [newTag, setNewTag] = useState('');

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    label: '',
    description: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const errors = {
      label: '',
      description: '',
    };

    let isValid = true;

    if (!formData.label.trim()) {
      errors.label = 'Project name is required';
      isValid = false;
    }

    if (formData.label.length > 100) {
      errors.label = 'Project name must be less than 100 characters';
      isValid = false;
    }

    if (formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newProject = await createProject({
        label: formData.label.trim(),
        description: formData.description.trim(),
        tags: formData.tags,
      });

      setSuccess(true);

      // Redirect to the newly created project after a short delay
      setTimeout(() => {
        navigate(`/projects/${newProject.id}`);
      }, 1500);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton
            onClick={() => navigate('/projects')}
            aria-label="back to projects"
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <FolderIcon sx={{ color: 'primary.main', fontSize: '2rem', mr: 1 }} />
          <Typography variant="h4" component="h1">
            Create New Project
          </Typography>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Project created successfully! Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                id="label"
                name="label"
                label="Project Name"
                value={formData.label}
                onChange={handleInputChange}
                error={!!formErrors.label}
                helperText={formErrors.label}
                disabled={loading || success}
                autoFocus
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                disabled={loading || success}
                multiline
                rows={4}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Tags
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {formData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    color="primary"
                    variant="outlined"
                    disabled={loading || success}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  id="newTag"
                  label="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading || success}
                  size="small"
                  fullWidth
                  sx={{ flexGrow: 1 }}
                />
                <Button
                  onClick={handleAddTag}
                  disabled={!newTag.trim() || loading || success}
                  startIcon={<AddIcon />}
                  variant="outlined"
                >
                  Add
                </Button>
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/projects')}
                startIcon={<CloseIcon />}
                sx={{ mr: 2 }}
                disabled={loading || success}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={loading || success}
              >
                Create Project
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProject;

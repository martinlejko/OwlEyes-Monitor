import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  LinearProgress,
  Alert,
  Grid as MuiGrid,
  Paper,
  Container,
  Stack,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  NetworkPing as PingIcon,
  Link as WebsiteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { createMonitor, getProjects } from '../services/api';
import { Project, PingMonitor, WebsiteMonitor } from '../types';

const Grid = MuiGrid as any;

const CreateMonitor: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({
    label: '',
    type: 'ping',
    badgeLabel: '',
    periodicity: 60,
    projectId: projectId ? parseInt(projectId) : undefined,
    host: '',
    port: null,
    url: '',
    checkStatus: false,
    keywords: [],
  });

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await getProjects(1, 100);
        setProjects(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'periodicity' || name === 'port') {
      const numValue = value === '' ? null : parseInt(value);
      setFormData({
        ...formData,
        [name]: numValue,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;

    if (name === 'projectId') {
      setFormData({
        ...formData,
        [name]: value ? parseInt(value) : undefined,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.label || formData.label.trim() === '') {
      errors.label = 'Monitor name is required';
    }

    if (!formData.badgeLabel || formData.badgeLabel.trim() === '') {
      errors.badgeLabel = 'Badge label is required';
    }

    if (!formData.projectId) {
      errors.projectId = 'Project is required';
    }

    if (!formData.periodicity || formData.periodicity < 5) {
      errors.periodicity =
        'Periodicity - how often should the monitor be checked in seconds The allowed range is between 5 and 300 seconds';
    }

    if (formData.type === 'ping') {
      if (!formData.host || formData.host.trim() === '') {
        errors.host = 'Host is required';
      }

      if (formData.port !== null && (formData.port < 1 || formData.port > 65535)) {
        errors.port = 'Port must be between 1 and 65535';
      }
    } else if (formData.type === 'website') {
      if (!formData.url || formData.url.trim() === '') {
        errors.url = 'URL is required';
      } else if (!/^https?:\/\//i.test(formData.url)) {
        errors.url = 'URL must start with http:// or https://';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (formData.type === 'ping') {
        const pingMonitorData: Omit<PingMonitor, 'id' | 'latestStatus'> = {
          label: formData.label.trim(),
          badgeLabel: formData.badgeLabel.trim(),
          periodicity: formData.periodicity,
          type: 'ping',
          projectId: formData.projectId,
          host: formData.host.trim(),
          port: formData.port !== null ? formData.port : 0,
        };

        console.log('Creating ping monitor with data:', pingMonitorData);
        try {
          const newMonitor = await createMonitor(pingMonitorData);
          console.log('Monitor created successfully:', newMonitor);
          navigate(`/monitors/${newMonitor.id}`);
        } catch (err: any) {
          console.error('API error details:', err);
          if (err.response?.data?.error) {
            setError(`Failed to create monitor: ${err.response.data.error}`);
          } else {
            setError('Failed to create monitor. Please try again later.');
          }
          setSaving(false);
        }
      } else if (formData.type === 'website') {
        const websiteMonitorData: Omit<WebsiteMonitor, 'id' | 'latestStatus'> = {
          label: formData.label.trim(),
          badgeLabel: formData.badgeLabel.trim(),
          periodicity: formData.periodicity,
          type: 'website',
          projectId: formData.projectId,
          url: formData.url.trim(),
          checkStatus: Boolean(formData.checkStatus),
          keywords: Array.isArray(formData.keywords) ? formData.keywords : [],
        };

        console.log('Creating website monitor with data:', websiteMonitorData);
        try {
          const newMonitor = await createMonitor(websiteMonitorData);
          console.log('Monitor created successfully:', newMonitor);
          navigate(`/monitors/${newMonitor.id}`);
        } catch (err: any) {
          console.error('API error details:', err);
          if (err.response?.data?.error) {
            setError(`Failed to create monitor: ${err.response.data.error}`);
          } else {
            setError('Failed to create monitor. Please try again later.');
          }
          setSaving(false);
        }
      }
    } catch (err) {
      console.error('Error in form submission:', err);
      setError('An unexpected error occurred. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0,0,0,0.05)' }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton
            onClick={() => navigate('/monitors')}
            aria-label="back to monitors"
            sx={{ mr: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Create New Monitor
          </Typography>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Monitor Name"
                name="label"
                value={formData.label}
                onChange={handleInputChange}
                error={!!formErrors.label}
                helperText={formErrors.label}
                disabled={saving}
                autoFocus
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Badge Label"
                name="badgeLabel"
                value={formData.badgeLabel}
                onChange={handleInputChange}
                error={!!formErrors.badgeLabel}
                helperText={formErrors.badgeLabel || 'Short label displayed on status badges'}
                disabled={saving}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth error={!!formErrors.projectId}>
                <InputLabel id="project-label">Project</InputLabel>
                <Select
                  labelId="project-label"
                  id="projectId"
                  name="projectId"
                  value={formData.projectId?.toString() || ''}
                  label="Project"
                  onChange={handleSelectChange}
                  disabled={saving || projectId !== null}
                  required
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id.toString()}>
                      {project.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.projectId && <FormHelperText>{formErrors.projectId}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Monitor Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={formData.type}
                  label="Monitor Type"
                  onChange={handleSelectChange}
                  disabled={saving}
                  required
                  startAdornment={
                    formData.type === 'ping' ? (
                      <PingIcon sx={{ ml: 1, mr: 1, color: 'text.secondary' }} />
                    ) : (
                      <WebsiteIcon sx={{ ml: 1, mr: 1, color: 'text.secondary' }} />
                    )
                  }
                >
                  <MenuItem value="ping">Ping Monitor</MenuItem>
                  <MenuItem value="website">Website Monitor</MenuItem>
                </Select>
                <FormHelperText>
                  {formData.type === 'ping'
                    ? 'Checks if host is reachable via ICMP ping'
                    : 'Checks if website returns expected status code'}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Check Interval (seconds)"
                name="periodicity"
                value={formData.periodicity || ''}
                onChange={handleInputChange}
                error={!!formErrors.periodicity}
                helperText={
                  formErrors.periodicity ||
                  'How often to check the service. The allowed range is between 5 and 300 seconds'
                }
                required
                inputProps={{ min: 5 }}
                disabled={saving}
              />
            </Grid>

            {formData.type === 'ping' && (
              <>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField
                    fullWidth
                    label="Host"
                    name="host"
                    value={formData.host || ''}
                    onChange={handleInputChange}
                    error={!!formErrors.host}
                    helperText={formErrors.host || 'Hostname or IP address to ping'}
                    required
                    disabled={saving}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Port (Optional)"
                    name="port"
                    value={formData.port || ''}
                    onChange={handleInputChange}
                    error={!!formErrors.port}
                    helperText={formErrors.port}
                    inputProps={{ min: 1, max: 65535 }}
                    disabled={saving}
                  />
                </Grid>
              </>
            )}

            {formData.type === 'website' && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="URL"
                  name="url"
                  value={formData.url || ''}
                  onChange={handleInputChange}
                  error={!!formErrors.url}
                  helperText={formErrors.url || 'Full URL including http:// or https://'}
                  required
                  disabled={saving}
                  placeholder="https://example.com"
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate('/monitors')}
                startIcon={<CloseIcon />}
                sx={{ mr: 2 }}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={saving}
              >
                Create Monitor
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateMonitor;

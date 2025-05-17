import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  LinearProgress,
  Alert,
  Divider,
  Grid,
  Paper,
  Stack,
  SelectChangeEvent,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Save as SaveIcon } from '@mui/icons-material';
import { getMonitor, updateMonitor } from '../services/api';
import { Monitor } from '../types';

const EditMonitor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Partial<Monitor> & Record<string, any>>({
    label: '',
    type: 'ping',
    badgeLabel: '',
    periodicity: 60,
  });

  useEffect(() => {
    const fetchMonitor = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const monitorData = await getMonitor(parseInt(id));
        setFormData({
          label: monitorData.label,
          type: monitorData.type,
          badgeLabel: monitorData.badgeLabel,
          periodicity: monitorData.periodicity,
          ...(monitorData.type === 'ping'
            ? {
                host: (monitorData as any).host,
                port: (monitorData as any).port,
              }
            : {}),
          ...(monitorData.type === 'website'
            ? {
                url: (monitorData as any).url,
              }
            : {}),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching monitor details:', err);
        setError('Failed to load monitor details. Please try again later.');
        setLoading(false);
      }
    };

    fetchMonitor();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.label || formData.label.trim() === '') {
      errors.label = 'Label is required';
    }

    if (!formData.badgeLabel || formData.badgeLabel.trim() === '') {
      errors.badgeLabel = 'Badge label is required';
    }

    if (!formData.periodicity || formData.periodicity < 5) {
      errors.periodicity =
        'Periodicity - how often should the monitor be checked in seconds The allowed range is between 5 and 300 seconds';
    }

    if (formData.type === 'ping') {
      if (!formData.host || formData.host.trim() === '') {
        errors.host = 'Host is required';
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

    if (!id) return;

    try {
      setSaving(true);

      const updateData: Record<string, any> = {
        label: formData.label,
        badgeLabel: formData.badgeLabel,
        periodicity: parseInt((formData.periodicity || 60).toString()),
        type: formData.type,
      };

      if (formData.type === 'ping') {
        updateData.host = formData.host || '';
        updateData.port = formData.port ? parseInt(formData.port.toString()) : null;
        updateData.url = null;
        updateData.checkStatus = false;
        updateData.keywords = [];
      } else if (formData.type === 'website') {
        updateData.url = formData.url || '';
        updateData.checkStatus = false;
        updateData.keywords = [];
        updateData.host = null;
        updateData.port = null;
      }

      console.log('Updating monitor with data:', updateData);

      try {
        const updatedMonitor = await updateMonitor(parseInt(id), updateData);
        console.log('Update successful:', updatedMonitor);
        setSaving(false);
        navigate(`/monitors/${id}`);
      } catch (error: any) {
        console.error('API error details:', error);
        console.error('Error response:', error.response?.data);
        throw error;
      }
    } catch (err) {
      console.error('Error updating monitor:', err);
      setError('Failed to update monitor. Please try again later.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading monitor details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/monitors/${id}`)}>
          Back to Monitor
        </Button>
        <Typography variant="h4">Edit Monitor</Typography>
      </Box>

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        {saving && <LinearProgress sx={{ mb: 2 }} />}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Label"
              name="label"
              value={formData.label || ''}
              onChange={handleInputChange}
              error={!!formErrors.label}
              helperText={formErrors.label}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Badge Label"
              name="badgeLabel"
              value={formData.badgeLabel || ''}
              onChange={handleInputChange}
              error={!!formErrors.badgeLabel}
              helperText={formErrors.badgeLabel}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                name="type"
                value={formData.type}
                label="Type"
                onChange={handleSelectChange}
                disabled
              >
                <MenuItem value="ping">Ping</MenuItem>
                <MenuItem value="website">Website</MenuItem>
              </Select>
              <FormHelperText>Monitor type cannot be changed</FormHelperText>
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
                  helperText={formErrors.host}
                  required
                />
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Port"
                  name="port"
                  value={formData.port || ''}
                  onChange={handleInputChange}
                  error={!!formErrors.port}
                  helperText={formErrors.port}
                  inputProps={{ min: 1, max: 65535 }}
                />
              </Grid>
            </>
          )}

          {formData.type === 'website' && (
            <>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="URL"
                  name="url"
                  value={formData.url || ''}
                  onChange={handleInputChange}
                  error={!!formErrors.url}
                  helperText={formErrors.url}
                  required
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            type="submit"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={saving}
          >
            Save Changes
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditMonitor;

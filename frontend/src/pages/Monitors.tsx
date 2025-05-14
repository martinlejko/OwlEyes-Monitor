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
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Dns as DnsIcon, // Icon for Monitors
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon, // Online status
  Error as ErrorIcon, // Offline status
  HelpOutline as UnknownStatusIcon, // Unknown status
  Link as LinkIcon, // For website type
  NetworkPing as PingIcon // For ping type
} from '@mui/icons-material';
import { getMonitors } from '../services/api';
import { Monitor } from '../types'; // MonitorType is Monitor['type']

const getStatusIcon = (status?: boolean | null) => {
  if (status === true) return <CheckCircleIcon color="success" sx={{ fontSize: '1.2rem'}} />;
  if (status === false) return <ErrorIcon color="error" sx={{ fontSize: '1.2rem'}}/>;
  return <UnknownStatusIcon color="disabled" sx={{ fontSize: '1.2rem'}}/>;
};

const getMonitorTypeIcon = (type?: Monitor['type']) => {
  if (type === 'website') return <LinkIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />;
  if (type === 'ping') return <PingIcon sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />;
  return null;
}

const MonitorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalMonitors, setTotalMonitors] = useState(0);

  const fetchMonitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMonitors(page + 1, rowsPerPage);
      setMonitors(response.data);
      setTotalMonitors(response.meta.total);
    } catch (err) {
      console.error('Error fetching monitors:', err);
      setError('Failed to load monitors. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewMonitor = (monitorId: number) => {
    navigate(`/monitors/${monitorId}`);
  };

  if (loading && monitors.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
        <LinearProgress sx={{ mb: 2 }}/>
        <Typography>Loading monitors...</Typography>
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
            <DnsIcon sx={{ mr: 1.5, fontSize: '2rem' }} color="primary" /> Monitors
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/monitors/new')} // TODO: Implement /monitors/new route
          >
            Create New Monitor
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {monitors.length === 0 && !loading ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No monitors found. Get started by creating your first monitor!
          </Alert>
        ) : (
          <Box>
            <Grid container spacing={3}>
              {monitors.map((monitor) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={monitor.id.toString()}>
                  <Card sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
                      transform: 'translateY(-2px)'
                    },
                    borderRadius: '8px' 
                  }}>
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'medium', mb: 0.5, flexGrow: 1, wordBreak: 'break-word' }}>
                          {getMonitorTypeIcon(monitor.type)}{monitor.label}
                        </Typography>
                        <Tooltip title={monitor.latestStatus?.status === true ? 'Online' : monitor.latestStatus?.status === false ? 'Offline' : 'Status Unknown'}>
                           <Box sx={{ ml: 1, mt: '4px' }}>{getStatusIcon(monitor.latestStatus?.status)}</Box>
                        </Tooltip>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Project ID: {monitor.projectId} | Periodicity: {monitor.periodicity}s
                      </Typography>
                      
                      {monitor.type === 'website' && monitor.url && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, wordBreak: 'break-all' }}>
                          URL: {monitor.url}
                        </Typography>
                      )}
                      {monitor.type === 'ping' && monitor.host && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Host: {monitor.host}{monitor.port ? `:${monitor.port}` : ''}
                        </Typography>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', pt: 0, pb: 1.5, px: 2 }}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewMonitor(monitor.id)}
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
              count={totalMonitors}
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
              labelRowsPerPage="Monitors per page:"
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default MonitorsPage; 
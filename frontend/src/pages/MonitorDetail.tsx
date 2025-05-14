import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  QueryStats as QueryStatsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { getMonitor, getMonitorStatuses, deleteMonitor } from '../services/api';
import { Monitor, MonitorStatus, PaginatedResponse } from '../types';

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [statuses, setStatuses] = useState<MonitorStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStatusCount, setTotalStatusCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch monitor details
        const monitorData = await getMonitor(parseInt(id));
        setMonitor(monitorData);
        
        // Fetch status history for this monitor
        const statusesResponse = await getMonitorStatuses(parseInt(id), page + 1, rowsPerPage, undefined, undefined, undefined, 'list');
        
        // Type assertion since we know we're requesting 'list' view
        const paginatedResponse = statusesResponse as PaginatedResponse<MonitorStatus>;
        setStatuses(paginatedResponse.data);
        setTotalStatusCount(paginatedResponse.meta.total);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching monitor details:', err);
        setError('Failed to load monitor details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEditClick = () => {
    if (id) {
      navigate(`/monitors/${id}/edit`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      
      if (id) {
        console.log('Confirming deletion of monitor ID:', id);
        
        const timestamp = new Date().getTime();
        console.log('Using timestamp for cache busting:', timestamp);
        
        await deleteMonitor(parseInt(id));
        console.log('Delete operation completed successfully');
        
        setDeleteDialogOpen(false);
        
        // After successful deletion, navigate back to project or dashboard
        if (monitor?.projectId) {
          const projectId = monitor.projectId;
          console.log('Navigating to project page with cache buster:', `/projects/${projectId}?_=${timestamp}`);
          
          // Force navigation with cache buster parameter
          window.location.href = `/projects/${projectId}?_=${timestamp}`;
        } else {
          console.log('Navigating to dashboard with cache buster');
          window.location.href = `/?_=${timestamp}`;
        }
      }
    } catch (error: any) {
      console.error('Error deleting monitor:', error);
      setDeleteError(error.response?.data?.error || 'Failed to delete monitor. Please try again later.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteError(null);
    setDeleteDialogOpen(false);
  };

  const getStatusColor = (status?: boolean): string => {
    if (status === undefined) return '#9e9e9e'; // Gray for unknown
    return status ? '#4caf50' : '#f44336'; // Green for up, red for down
  };

  const getStatusText = (status?: boolean): string => {
    if (status === undefined) return 'UNKNOWN';
    return status ? 'UP' : 'DOWN';
  };

  const getMonitorTypeDetails = () => {
    if (!monitor) return null;
    
    if (monitor.type === 'ping') {
      const pingMonitor = monitor as any; // Using any as a workaround for type casting
      return (
        <Typography variant="body2" color="text.secondary">
          Host: {pingMonitor.host} 
          {pingMonitor.port && ` : ${pingMonitor.port}`}
        </Typography>
      );
    } else if (monitor.type === 'website') {
      const websiteMonitor = monitor as any; // Using any as a workaround for type casting
      return (
        <Typography variant="body2" color="text.secondary">
          URL: {websiteMonitor.url}
        </Typography>
      );
    }
    
    return null;
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
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!monitor) {
    return (
      <Box>
        <Alert severity="warning">Monitor not found</Alert>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(-1)} 
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/projects/${monitor.projectId}`)}
        >
          Back to Project
        </Button>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<QueryStatsIcon />}
            onClick={() => navigate(`/monitors/${id}/statistics`)}
            sx={{ mr: 1 }}
          >
            View Statistics
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<EditIcon />}
            onClick={handleEditClick}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleDeleteClick}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start'
          }}>
            <Box>
              <Typography variant="h4" gutterBottom>
                {monitor.label}
              </Typography>
              <Chip 
                label={monitor.type.toUpperCase()} 
                color={monitor.type === 'ping' ? 'info' : 'secondary'} 
                sx={{ mb: 1 }}
              />
              {getMonitorTypeDetails()}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Check interval: {monitor.periodicity} seconds
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Badge label: {monitor.badgeLabel}
              </Typography>
            </Box>
            <Box>
              <Chip 
                label={getStatusText(monitor.latestStatus?.status)} 
                color={monitor.latestStatus?.status ? 'success' : 'error'} 
                sx={{ fontWeight: 'bold', fontSize: '1.1rem', px: 2, py: 2.5 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Recent Status History
        </Typography>
        
        {statuses.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No status history found for this monitor.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Response Time (ms)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id}>
                    <TableCell>
                      {format(new Date(status.startTime), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(status.startTime), 'HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={status.status ? 'UP' : 'DOWN'} 
                        size="small" 
                        color={status.status ? 'success' : 'error'} 
                      />
                    </TableCell>
                    <TableCell align="right">{status.responseTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalStatusCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        )}
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Badge
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            Use this badge in your README or website to show the current status of this monitor:
          </Typography>
          
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace', overflowX: 'auto' }}>
              {`![${monitor.badgeLabel} Status](http://localhost:8000/badge/${monitor.id})`}
            </Typography>
          </Box>
          
          <Box sx={{ mt: 2, p: 1, display: 'flex', justifyContent: 'center' }}>
            <img 
              src={`http://localhost:8000/badge/${monitor.id}`} 
              alt={`${monitor.badgeLabel} Status`}
            />
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Monitor"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this monitor? This action cannot be undone.
            All status history for this monitor will also be deleted.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>Cancel</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MonitorDetail; 
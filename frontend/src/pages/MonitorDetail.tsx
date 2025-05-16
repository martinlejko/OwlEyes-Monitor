import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Button,
  Paper,
  Tab,
  Tabs
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  List as ListIcon,
  CalendarMonth as CalendarIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';
import { subMonths, startOfMonth } from 'date-fns';
import { getMonitor, getMonitorStatuses, deleteMonitor } from '../services/api';
import { Monitor, MonitorStatus, PaginatedResponse, CalendarDataPoint, GraphDataPoint } from '../types';

// Import our modular components
import {
  TabPanel,
  ListView,
  CalendarView,
  GraphView,
  MonitorHeader,
  BadgeSection,
  FilterBar,
  DeleteDialog
} from '../components/monitors';

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // States for monitor data and loading
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // States for status list view
  const [statuses, setStatuses] = useState<MonitorStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStatusCount, setTotalStatusCount] = useState(0);
  
  // States for calendar view
  const [calendarData, setCalendarData] = useState<CalendarDataPoint[]>([]);
  
  // States for graph view
  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);
  
  // States for tab navigation
  const [tabValue, setTabValue] = useState(0);
  
  // States for delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // States for status filtering
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Ref for auto-update interval
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMonitor = async () => {
    try {
      if (!id) return;
      
      const monitorData = await getMonitor(parseInt(id));
      setMonitor(monitorData);
    } catch (err: any) {
      console.error('Error fetching monitor:', err);
      setError(err.message || 'Failed to load monitor details');
    }
  };

  const fetchStatusData = async (viewMode = tabValue) => {
    try {
      if (!id) return;
      
      const monitorId = parseInt(id);
      let from: Date | undefined = undefined;
      let to: Date | undefined = undefined;
      let statusFilterValue: boolean | undefined = undefined;
      
      // Handle filters
      if (dateFrom) {
        from = new Date(dateFrom);
      }
      
      if (dateTo) {
        to = new Date(dateTo);
        // Set time to end of day
        to.setHours(23, 59, 59, 999);
      }
      
      if (statusFilter === 'up') {
        statusFilterValue = true;
      } else if (statusFilter === 'down') {
        statusFilterValue = false;
      }
      
      // Fetch data based on view mode
      if (viewMode === 0) { // List view
        const response = await getMonitorStatuses(
          monitorId, 
          page + 1, 
          rowsPerPage, 
          from, 
          to, 
          statusFilterValue,
          'list'
        );
        
        // Type assertion since we know the structure based on view
        const listResponse = response as PaginatedResponse<MonitorStatus>;
        setStatuses(listResponse.data);
        setTotalStatusCount(listResponse.meta.total);
        
      } else if (viewMode === 1) { // Calendar view
        // Use a dynamic approach to date ranges
        // First try looking at the most recent 3 months of data (default view)
        const fromDate = startOfMonth(subMonths(new Date(), 2)); // From start of 2 months ago
        const toDate = new Date(); // To today
        
        const response = await getMonitorStatuses(
          monitorId, 
          1, 
          1000, // Large enough to ensure we get all needed data
          fromDate,
          toDate,
          statusFilterValue,
          'calendar'
        );
        
        // Type assertion
        const calendarResponse = response as { data: CalendarDataPoint[] };
        setCalendarData(calendarResponse.data);
        
      } else if (viewMode === 2) { // Graph view
        const response = await getMonitorStatuses(
          monitorId, 
          1, 
          100, 
          from || subMonths(new Date(), 1), // Default to 1 month if not specified
          to || new Date(),
          undefined, // Don't filter by status for graph
          'graph'
        );
        
        // Type assertion
        const graphResponse = response as { data: GraphDataPoint[] };
        setGraphData(graphResponse.data);
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching status data:', err);
      setError(err.message || 'Failed to load status data');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await fetchMonitor();
    await fetchStatusData();
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    
    // Set up live updates
    updateIntervalRef.current = setInterval(() => {
      fetchMonitor();
      fetchStatusData();
    }, 5000); // 5 seconds update interval
    
    return () => {
      // Clean up interval on component unmount
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [id]);
  
  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchStatusData();
  }, [page, rowsPerPage, statusFilter, dateFrom, dateTo, tabValue]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleStatusFilterChange = (event: any) => {
    setStatusFilter(event.target.value);
    setPage(0); // Reset to first page on filter change
  };
  
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'dateFrom') {
      setDateFrom(value);
    } else if (name === 'dateTo') {
      setDateTo(value);
    }
    setPage(0); // Reset to first page on filter change
  };
  
  const handleRefresh = () => {
    fetchStatusData();
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
          
          // Use React Router navigation instead of direct location change
          navigate(`/projects/${projectId}?_=${timestamp}`);
        } else {
          console.log('Navigating to dashboard with cache buster');
          navigate(`/?_=${timestamp}`);
        }
      }
    } catch (error: any) {
      console.error('Detailed error object when deleting monitor:', error);
      let displayErrorMessage = 'Failed to delete monitor. Please try again later.';
      if (error.isAxiosError && error.response) {
        // Server responded with an error status code (4xx or 5xx)
        if (error.response.data && typeof error.response.data.error === 'string') {
          displayErrorMessage = error.response.data.error;
        } else {
          // Response data is not in the expected format, or no specific error message from backend
          displayErrorMessage = `Server error: ${error.response.status} ${error.response.statusText || ''}`.trim();
        }
      } else if (error.isAxiosError && error.request) {
        // The request was made but no response was received
        displayErrorMessage = 'No response from server. Check network connection or server status.';
      } else {
        // Something happened in setting up the request that triggered an Error, or a non-Axios error
        displayErrorMessage = error.message || 'An unexpected error occurred.';
      }
      setDeleteError(displayErrorMessage);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteError(null);
    setDeleteDialogOpen(false);
  };

  const handleGoBack = () => {
    if (monitor?.projectId) {
      navigate(`/projects/${monitor.projectId}`);
    } else {
      navigate(-1);
    }
  };

  if (loading && !monitor) {
    return (
      <Box>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading monitor details...
        </Typography>
      </Box>
    );
  }

  if (error && !monitor) {
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
      {/* Monitor header with actions */}
      <MonitorHeader 
        monitor={monitor}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onBack={handleGoBack}
      />
      
      {/* Monitor history section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Monitor History
        </Typography>
        
        <Paper sx={{ width: '100%' }}>
          {/* Tab navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="monitor views"
              variant="fullWidth"
            >
              <Tab 
                icon={<ListIcon />} 
                label="List View" 
                id="monitor-tab-0" 
                aria-controls="monitor-tabpanel-0" 
              />
              <Tab 
                icon={<CalendarIcon />} 
                label="Calendar View" 
                id="monitor-tab-1" 
                aria-controls="monitor-tabpanel-1" 
              />
              <Tab 
                icon={<ChartIcon />} 
                label="Graph View" 
                id="monitor-tab-2" 
                aria-controls="monitor-tabpanel-2" 
              />
            </Tabs>
          </Box>
          
          {/* Filters */}
          <FilterBar 
            statusFilter={statusFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onStatusFilterChange={handleStatusFilterChange}
            onDateChange={handleDateChange}
            onRefresh={handleRefresh}
          />
          
          {/* List View */}
          <TabPanel value={tabValue} index={0}>
            <ListView 
              statuses={statuses}
              totalCount={totalStatusCount}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={loading}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TabPanel>
          
          {/* Calendar View */}
          <TabPanel value={tabValue} index={1}>
            <CalendarView 
              data={calendarData} 
              onRefresh={handleRefresh} 
              loading={loading}
              monitorId={monitor.id}
            />
          </TabPanel>
          
          {/* Graph View */}
          <TabPanel value={tabValue} index={2}>
            <GraphView 
              data={graphData} 
              onRefresh={handleRefresh}
              loading={loading}
            />
          </TabPanel>
        </Paper>
      </Box>
      
      {/* Badge section */}
      <BadgeSection 
        monitorId={monitor.id} 
        badgeLabel={monitor.badgeLabel}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog 
        open={deleteDialogOpen}
        title="Delete Monitor"
        message="Are you sure you want to delete this monitor? This action cannot be undone. All status history for this monitor will also be deleted."
        error={deleteError}
        isDeleting={isDeleting}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default MonitorDetail; 
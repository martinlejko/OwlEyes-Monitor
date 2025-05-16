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

  // Add new state for refresh loading
  const [refreshing, setRefreshing] = useState(false);

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
      
      console.log(`Fetching data with viewMode: ${viewMode}, statusFilter: ${statusFilter}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, page: ${page}`);
      
      // Fetch data based on view mode - preserving the current state
      const currentViewMode = viewMode; // Ensure we use the passed viewMode
      
      if (currentViewMode === 0) { // List view
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
        
      } else if (currentViewMode === 1) { // Calendar view
        // For calendar view, if date filters are specified, use them
        // otherwise use the default 3-month range
        let fromDate = from;
        let toDate = to;
        
        if (!fromDate && !toDate) {
          fromDate = startOfMonth(subMonths(new Date(), 2)); // From start of 2 months ago
          toDate = new Date(); // To today
        }
        
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
        
      } else if (currentViewMode === 2) { // Graph view
        // For graph view, if date filters are specified, use them
        // otherwise use the default 1-month range
        let fromDate = from || subMonths(new Date(), 1);
        let toDate = to || new Date();
        
        const response = await getMonitorStatuses(
          monitorId, 
          1, 
          100, 
          fromDate,
          toDate,
          statusFilterValue, // Apply status filter for graph view too
          'graph'
        );
        
        // Type assertion
        const graphResponse = response as { data: GraphDataPoint[] };
        setGraphData(graphResponse.data);
      }
      
      // Only set loading to false once all operations complete
      setLoading(false);
      
      // Log successful completion with preserved filter values
      console.log('Status data fetch complete with preserved filters:', {
        viewMode: currentViewMode,
        statusFilter,
        dateFrom,
        dateTo,
        page
      });
      
    } catch (err: any) {
      console.error('Error fetching status data:', err);
      setError(err.message || 'Failed to load status data');
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // First fetch the monitor data
    await fetchMonitor();
    
    // Then fetch status data with current filters preserved
    const currentTabValue = tabValue;
    console.log('Initial data fetch with preserved filters:', {
      tabValue: currentTabValue,
      statusFilter,
      dateFrom,
      dateTo,
      page
    });
    
    await fetchStatusData(currentTabValue);
  };

  // Initialize data
  useEffect(() => {
    fetchData();
    
    // Set up live updates with a reference to the current state values
    updateIntervalRef.current = setInterval(() => {
      // Only refresh monitor data without refreshing status data if filters are applied
      fetchMonitor();
      
      // Create a closure to capture the current filter state values
      const capturedTabValue = tabValue;
      const capturedStatusFilter = statusFilter;
      const capturedDateFrom = dateFrom;
      const capturedDateTo = dateTo;
      const capturedPage = page;
      const capturedRowsPerPage = rowsPerPage;
      
      console.log('Auto-refresh with preserved filters:', {
        tabValue: capturedTabValue,
        statusFilter: capturedStatusFilter,
        dateFrom: capturedDateFrom,
        dateTo: capturedDateTo,
        page: capturedPage
      });
      
      // Pass all current state to ensure filters are preserved
      fetchStatusData(capturedTabValue);
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
    // Skip on initial render as fetchData will handle it
    // Note: we need to check if loading is false AND we have monitor data
    if (!loading && monitor) {
      console.log('Filter changed, refreshing data with:', {
        tabValue,
        statusFilter,
        dateFrom,
        dateTo,
        page
      });
      fetchStatusData(tabValue);
    }
  }, [page, rowsPerPage, statusFilter, dateFrom, dateTo, tabValue, monitor]);

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
  
  const handleRefresh = async () => {
    // Set refreshing state to true to show loading indicator
    setRefreshing(true);
    
    // Create local variables to ensure current state is used
    const currentTabValue = tabValue;
    const currentStatusFilter = statusFilter;
    const currentDateFrom = dateFrom;
    const currentDateTo = dateTo;
    
    console.log('Manual refresh with filters:', {
      tabValue: currentTabValue,
      statusFilter: currentStatusFilter,
      dateFrom: currentDateFrom,
      dateTo: currentDateTo
    });
    
    try {
      // Explicitly call fetchStatusData with current tabValue and preserve all filters
      await fetchStatusData(currentTabValue);
      // Flash a success message or indication here if needed
    } catch (error) {
      console.error('Error during manual refresh:', error);
      // Handle any errors during refresh
    } finally {
      // Reset refreshing state after a short delay to make the loading indicator visible
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
  };

  const handleResetFilters = async () => {
    console.log('Resetting all filters to default values');
    
    // Show loading indicator
    setRefreshing(true);
    
    // Reset filter states to their defaults
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    // Also reset to the first page
    setPage(0);
    
    try {
      // Fetch data with the reset filters
      console.log('Fetching data with reset filters');
      await fetchStatusData(tabValue);
    } catch (error) {
      console.error('Error during filter reset:', error);
    } finally {
      // Reset refreshing state after a short delay
      setTimeout(() => {
        setRefreshing(false);
      }, 500);
    }
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
            onResetFilters={handleResetFilters}
            isRefreshing={refreshing}
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
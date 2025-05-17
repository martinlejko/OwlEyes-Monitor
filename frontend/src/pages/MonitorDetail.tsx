import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, LinearProgress, Alert, Button, Paper, Tab, Tabs } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  List as ListIcon,
  CalendarMonth as CalendarIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { subMonths, startOfMonth } from 'date-fns';
import { getMonitor, getMonitorStatuses, deleteMonitor } from '../services/api';
import {
  Monitor,
  MonitorStatus,
  PaginatedResponse,
  CalendarDataPoint,
  GraphDataPoint,
} from '../types';

import {
  TabPanel,
  ListView,
  CalendarView,
  GraphView,
  MonitorHeader,
  BadgeSection,
  FilterBar,
  DeleteDialog,
} from '../components/monitors';

const MonitorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statuses, setStatuses] = useState<MonitorStatus[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalStatusCount, setTotalStatusCount] = useState(0);

  const [calendarData, setCalendarData] = useState<CalendarDataPoint[]>([]);

  const [graphData, setGraphData] = useState<GraphDataPoint[]>([]);

  const [tabValue, setTabValue] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const fetchMonitor = useCallback(async () => {
    try {
      if (!id) return;

      const monitorData = await getMonitor(parseInt(id));
      setMonitor(monitorData);
    } catch (err: any) {
      console.error('Error fetching monitor:', err);
      setError(err.message || 'Failed to load monitor details');
    }
  }, [id]);

  const fetchStatusData = useCallback(
    async (viewMode = tabValue) => {
      // Set a loading indicator but with a slight delay to avoid flicker on fast responses
      const loadingTimer = setTimeout(() => {
        if (!fetchInProgressRef.current) return; // If request already finished, don't show loading
        setLoading(true);
      }, 300);

      try {
        if (!id) {
          clearTimeout(loadingTimer);
          return;
        }

        // Mark fetch in progress
        fetchInProgressRef.current = true;

        const monitorId = parseInt(id);
        let from: Date | undefined = undefined;
        let to: Date | undefined = undefined;
        let statusFilterValue: boolean | undefined = undefined;

        // Handle filters - only apply for list view
        if (viewMode === 0) {
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
        }

        console.log(
          `Fetching data with viewMode: ${viewMode}, statusFilter: ${statusFilter}, dateFrom: ${dateFrom}, dateTo: ${dateTo}, page: ${page}`,
        );

        // Fetch data based on view mode - preserving the current state
        const currentViewMode = viewMode; // Ensure we use the passed viewMode

        if (currentViewMode === 0) {
          // List view
          const response = await getMonitorStatuses(
            monitorId,
            page + 1,
            rowsPerPage,
            from,
            to,
            statusFilterValue,
            'list',
          );

          // Type assertion since we know the structure based on view
          const listResponse = response as PaginatedResponse<MonitorStatus>;
          setStatuses(listResponse.data);
          setTotalStatusCount(listResponse.meta.total);
        } else if (currentViewMode === 1) {
          // Calendar view
          // For calendar view, always use a fixed 3-month range and don't apply filters
          const fromDate = startOfMonth(subMonths(new Date(), 2)); // From start of 2 months ago
          const toDate = new Date(); // To today

          const response = await getMonitorStatuses(
            monitorId,
            1,
            1000, // Large enough to ensure we get all needed data
            fromDate,
            toDate,
            undefined, // Don't use status filter for calendar view
            'calendar',
          );

          // Type assertion
          const calendarResponse = response as { data: CalendarDataPoint[] };
          setCalendarData(calendarResponse.data);
        } else if (currentViewMode === 2) {
          // Graph view
          // For graph view, always use a fixed 1-month range and don't apply filters
          const fromDate = subMonths(new Date(), 1);
          const toDate = new Date();

          const response = await getMonitorStatuses(
            monitorId,
            1,
            100,
            fromDate,
            toDate,
            undefined, // Don't use status filter for graph view
            'graph',
          );

          // Type assertion
          const graphResponse = response as { data: GraphDataPoint[] };
          setGraphData(graphResponse.data);
        }

        // Log successful completion with preserved filter values
        console.log('Status data fetch complete with preserved filters:', {
          viewMode: currentViewMode,
          statusFilter,
          dateFrom,
          dateTo,
          page,
        });

        // Clear the loading timer
        clearTimeout(loadingTimer);

        // Ensure the loading indicator stays visible long enough to be meaningful
        // This prevents the progress bar from disappearing too quickly
        setTimeout(() => {
          setLoading(false);

          // Give a small delay before allowing new fetches to ensure loading animation completes
          setTimeout(() => {
            fetchInProgressRef.current = false;
          }, 800);
        }, 500);
      } catch (err: any) {
        console.error('Error fetching status data:', err);
        setError(err.message || 'Failed to load status data');

        // Clear the loading timer
        clearTimeout(loadingTimer);

        // Complete loading with a slight delay
        setTimeout(() => {
          setLoading(false);
          fetchInProgressRef.current = false;
        }, 500);
      }
    },
    [id, dateFrom, dateTo, page, rowsPerPage, statusFilter, tabValue],
  );

  const fetchData = useCallback(async () => {
    // Don't set loading immediately to avoid flickering
    fetchInProgressRef.current = true;
    setError(null);

    // Use a delayed loading indicator to avoid flickering on fast loads
    const loadingTimer = setTimeout(() => {
      // Only show loading if the request is still in progress
      if (fetchInProgressRef.current) {
        setLoading(true);
      }
    }, 300);

    try {
      // First fetch the monitor data
      await fetchMonitor();

      // Then fetch status data with current filters preserved
      const currentTabValue = tabValue;
      console.log('Initial data fetch for tab:', { tabValue: currentTabValue });

      await fetchStatusData(currentTabValue);
    } catch (error) {
      console.error('Error during initial data fetch:', error);
      setError('Failed to load monitor data. Please try refreshing the page.');
    } finally {
      // Clear the loading timer
      clearTimeout(loadingTimer);

      // Ensure the loading state completes in a user-friendly way
      setTimeout(() => {
        setLoading(false);

        // Allow a small delay before new fetches
        setTimeout(() => {
          fetchInProgressRef.current = false;
        }, 500);
      }, 500);
    }
  }, [fetchMonitor, fetchStatusData, tabValue]);

  // Track if a request is in progress to prevent overlapping fetches
  const fetchInProgressRef = useRef(false);

  // Initialize data
  useEffect(() => {
    // Initial data load
    fetchData();

    // Set up live updates with a much longer interval to avoid jitter
    updateIntervalRef.current = setInterval(() => {
      // Skip if a request is already in progress
      if (fetchInProgressRef.current) {
        console.log('Skipping auto-refresh because a request is already in progress');
        return;
      }

      // Set the in-progress flag
      fetchInProgressRef.current = true;

      // Check if this monitor has a fast refresh rate that requires more frequent updates
      const hasFastRefreshRate = monitor && monitor.periodicity <= 5;

      // For fast-refresh monitors, we need to update more frequently
      // For others, only do full refreshes periodically to reduce UI jitter
      const shouldRefreshAll = hasFastRefreshRate || Date.now() % 15000 < 5000;

      if (shouldRefreshAll) {
        console.log('Performing full data refresh...');

        // Capture current filter values
        const capturedTabValue = tabValue;

        // Start with just fetching monitor metadata
        fetchMonitor()
          .then(() => {
            // Then fetch status data
            return fetchStatusData(capturedTabValue);
          })
          .catch((error) => {
            console.error('Error during auto-refresh:', error);
          })
          .finally(() => {
            // Reset the in-progress flag
            setTimeout(() => {
              fetchInProgressRef.current = false;
            }, 1000); // Add a small delay to ensure loading animation completes
          });
      } else {
        // Just update the monitor metadata for most refreshes
        console.log('Performing metadata-only refresh...');
        fetchMonitor().finally(() => {
          // Reset the in-progress flag
          setTimeout(() => {
            fetchInProgressRef.current = false;
          }, 1000);
        });
      }
    }, 5000); // Update every 5 seconds to match fast monitors

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [fetchData, fetchMonitor, fetchStatusData, tabValue, monitor]);

  // Use a ref to track initial render and avoid jittery UI
  const isInitialRender = useRef(true);
  const previousFiltersRef = useRef({ tabValue, statusFilter, dateFrom, dateTo, page });

  // Fetch data when filters or pagination change - optimized to avoid jitter
  useEffect(() => {
    // Skip the first render as fetchData will handle it
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    // Skip if monitor isn't loaded yet
    if (!loading && monitor) {
      const prevFilters = previousFiltersRef.current;

      // Only refresh if the filter values have actually changed
      if (
        prevFilters.tabValue !== tabValue ||
        prevFilters.statusFilter !== statusFilter ||
        prevFilters.dateFrom !== dateFrom ||
        prevFilters.dateTo !== dateTo ||
        prevFilters.page !== page
      ) {
        console.log('Filters changed, refreshing data with:', {
          tabValue,
          statusFilter,
          dateFrom,
          dateTo,
          page,
        });

        // Update what we consider the previous values
        previousFiltersRef.current = { tabValue, statusFilter, dateFrom, dateTo, page };

        // Fetch the data with current values
        fetchStatusData(tabValue);
      }
    }
  }, [fetchStatusData, loading, monitor, tabValue, statusFilter, dateFrom, dateTo, page]);

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
    setPage(0);
  };

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === 'dateFrom') {
      setDateFrom(value);
    } else if (name === 'dateTo') {
      setDateTo(value);
    }
    setPage(0);
  };

  const handleRefresh = async () => {
    // If a fetch is already in progress, don't start another one
    if (fetchInProgressRef.current) {
      console.log('Skipping manual refresh because a request is already in progress');
      return;
    }

    // Set refreshing state to true to show loading indicator
    setRefreshing(true);

    const currentTabValue = tabValue;

    console.log('Manual refresh with current tab:', { tabValue: currentTabValue });

    try {
      await fetchStatusData(currentTabValue);
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      // Reset refreshing state after a meaningful delay to ensure loading indicator completes
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    }
  };

  const handleResetFilters = async () => {
    console.log('Resetting all filters to default values');

    setRefreshing(true);

    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);

    try {
      console.log('Fetching data with reset filters');
      await fetchStatusData(tabValue);
    } catch (error) {
      console.error('Error during filter reset:', error);
    } finally {
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

        if (monitor?.projectId) {
          const projectId = monitor.projectId;
          console.log(
            'Navigating to project page with cache buster:',
            `/projects/${projectId}?_=${timestamp}`,
          );

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
        if (error.response.data && typeof error.response.data.error === 'string') {
          displayErrorMessage = error.response.data.error;
        } else {
          displayErrorMessage =
            `Server error: ${error.response.status} ${error.response.statusText || ''}`.trim();
        }
      } else if (error.isAxiosError && error.request) {
        displayErrorMessage = 'No response from server. Check network connection or server status.';
      } else {
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  if (!monitor) {
    return (
      <Box>
        <Alert severity="warning">Monitor not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <MonitorHeader
        monitor={monitor}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onBack={handleGoBack}
      />

      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Monitor History
        </Typography>

        <Paper sx={{ width: '100%' }}>
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

          {tabValue === 0 && (
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
          )}

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

          <TabPanel value={tabValue} index={1}>
            <CalendarView
              data={calendarData}
              onRefresh={handleRefresh}
              loading={loading}
              monitorId={monitor.id}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <GraphView data={graphData} onRefresh={handleRefresh} loading={loading} />
          </TabPanel>
        </Paper>
      </Box>

      <BadgeSection monitorId={monitor.id} badgeLabel={monitor.badgeLabel} />

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
